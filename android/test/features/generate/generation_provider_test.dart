import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/core/providers.dart';
import 'package:tech_blog_catchup/features/generate/generation_provider.dart';
import 'package:tech_blog_catchup/services/api_client.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApi;
  late ProviderContainer container;

  setUp(() {
    mockApi = MockApiClient();
  });

  ProviderContainer createContainer() {
    final c = ProviderContainer(
      overrides: [apiClientProvider.overrideWithValue(mockApi)],
    );
    addTearDown(c.dispose);
    return c;
  }

  group('GenerationNotifier', () {
    test('initial state has isGenerating=false, empty activeJobIds, null error', () {
      container = createContainer();
      final state = container.read(generationProvider);
      expect(state.isGenerating, false);
      expect(state.activeJobIds, isEmpty);
      expect(state.error, isNull);
    });

    test('generate(postId) sets isGenerating=true and stores jobId', () async {
      when(() => mockApi.triggerGenerate(postId: 42, limit: any(named: 'limit')))
          .thenAnswer((_) async => {'job_id': 99});

      container = createContainer();
      final notifier = container.read(generationProvider.notifier);

      await notifier.generate(42);

      final state = container.read(generationProvider);
      expect(state.isGenerating, true);
      expect(state.activeJobIds, contains(99));
      expect(state.error, isNull);
    });

    test('generate(postId) on API error sets error and clears isGenerating', () async {
      when(() => mockApi.triggerGenerate(postId: 42, limit: any(named: 'limit')))
          .thenThrow(Exception('Server error'));

      container = createContainer();
      final notifier = container.read(generationProvider.notifier);

      await notifier.generate(42);

      final state = container.read(generationProvider);
      expect(state.isGenerating, false);
      expect(state.error, contains('Server error'));
      expect(state.activeJobIds, isEmpty);
    });

    test('generateBatch() sets isGenerating=true and stores jobId', () async {
      when(() => mockApi.triggerGenerate(limit: any(named: 'limit')))
          .thenAnswer((_) async => {'job_id': 77});

      container = createContainer();
      final notifier = container.read(generationProvider.notifier);

      await notifier.generateBatch();

      final state = container.read(generationProvider);
      expect(state.isGenerating, true);
      expect(state.activeJobIds, contains(77));
    });

    test('generateBatch() on API error sets error and clears isGenerating', () async {
      when(() => mockApi.triggerGenerate(limit: any(named: 'limit')))
          .thenThrow(Exception('Network error'));

      container = createContainer();
      final notifier = container.read(generationProvider.notifier);

      await notifier.generateBatch();

      final state = container.read(generationProvider);
      expect(state.isGenerating, false);
      expect(state.error, contains('Network error'));
    });

    test('hasActiveJobs returns true when activeJobIds is non-empty', () async {
      when(() => mockApi.triggerGenerate(postId: 1, limit: any(named: 'limit')))
          .thenAnswer((_) async => {'job_id': 10});

      container = createContainer();
      final notifier = container.read(generationProvider.notifier);

      expect(container.read(generationProvider).hasActiveJobs, false);

      await notifier.generate(1);

      expect(container.read(generationProvider).hasActiveJobs, true);
    });
  });
}
