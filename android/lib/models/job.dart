import 'package:freezed_annotation/freezed_annotation.dart';

part 'job.freezed.dart';
part 'job.g.dart';

@freezed
class Job with _$Job {
  const factory Job({
    required int id,
    required String jobType,
    required String status,
    String? params,
    String? result,
    String? errorMessage,
    required DateTime createdAt,
    DateTime? startedAt,
    DateTime? completedAt,
  }) = _Job;

  factory Job.fromJson(Map<String, dynamic> json) => _$JobFromJson(json);
}
