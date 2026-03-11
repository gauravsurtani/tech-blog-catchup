import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../theme/app_config.dart';

class GenerationState {
  final bool isGenerating;
  final Set<int> activeJobIds;
  final String? error;

  const GenerationState({
    this.isGenerating = false,
    this.activeJobIds = const {},
    this.error,
  });

  bool get hasActiveJobs => activeJobIds.isNotEmpty;

  GenerationState copyWith({
    bool? isGenerating,
    Set<int>? activeJobIds,
    String? error,
  }) {
    return GenerationState(
      isGenerating: isGenerating ?? this.isGenerating,
      activeJobIds: activeJobIds ?? this.activeJobIds,
      error: error,
    );
  }
}

class GenerationNotifier extends StateNotifier<GenerationState> {
  GenerationNotifier(this._ref) : super(const GenerationState());

  final Ref _ref;
  Timer? _pollTimer;
  int _consecutiveFailures = 0;
  static const _maxConsecutiveFailures = 5;

  Future<void> generate(int postId) async {
    final api = _ref.read(apiClientProvider);
    state = state.copyWith(isGenerating: true, error: null);

    try {
      final result = await api.triggerGenerate(postId: postId);
      final jobId = result['job_id'] as int;
      state = state.copyWith(
        activeJobIds: {...state.activeJobIds, jobId},
      );
      _startPolling();
    } catch (e) {
      state = state.copyWith(
        isGenerating: false,
        error: e.toString(),
      );
    }
  }

  Future<void> generateBatch() async {
    final api = _ref.read(apiClientProvider);
    state = state.copyWith(isGenerating: true, error: null);

    try {
      final result = await api.triggerGenerate();
      final jobId = result['job_id'] as int;
      state = state.copyWith(
        activeJobIds: {...state.activeJobIds, jobId},
      );
      _startPolling();
    } catch (e) {
      state = state.copyWith(
        isGenerating: false,
        error: e.toString(),
      );
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(seconds: AppConfig.jobPollIntervalSeconds),
      (_) => _pollJobs(),
    );
  }

  Future<void> _pollJobs() async {
    if (state.activeJobIds.isEmpty) {
      _pollTimer?.cancel();
      state = state.copyWith(isGenerating: false);
      return;
    }

    final api = _ref.read(apiClientProvider);
    final completedIds = <int>{};

    var hadError = false;
    for (final jobId in state.activeJobIds) {
      try {
        final job = await api.getJob(jobId);
        if (job.status == 'completed' || job.status == 'failed') {
          completedIds.add(jobId);
        }
      } catch (_) {
        hadError = true;
      }
    }

    if (hadError) {
      _consecutiveFailures++;
      if (_consecutiveFailures >= _maxConsecutiveFailures) {
        _pollTimer?.cancel();
        state = state.copyWith(
          isGenerating: false,
          error: 'Lost connection to server after $_consecutiveFailures failed attempts',
        );
        return;
      }
    } else {
      _consecutiveFailures = 0;
    }

    if (completedIds.isNotEmpty) {
      final remaining = {...state.activeJobIds}..removeAll(completedIds);
      state = state.copyWith(
        activeJobIds: remaining,
        isGenerating: remaining.isNotEmpty,
      );
      if (remaining.isEmpty) {
        _pollTimer?.cancel();
      }
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}

final generationProvider =
    StateNotifierProvider<GenerationNotifier, GenerationState>(
  GenerationNotifier.new,
);
