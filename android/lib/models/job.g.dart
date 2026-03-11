// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'job.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$JobImpl _$$JobImplFromJson(Map<String, dynamic> json) => _$JobImpl(
  id: (json['id'] as num).toInt(),
  jobType: json['job_type'] as String,
  status: json['status'] as String,
  params: json['params'] as String?,
  result: json['result'] as String?,
  errorMessage: json['error_message'] as String?,
  createdAt: DateTime.parse(json['created_at'] as String),
  startedAt: json['started_at'] == null
      ? null
      : DateTime.parse(json['started_at'] as String),
  completedAt: json['completed_at'] == null
      ? null
      : DateTime.parse(json['completed_at'] as String),
);

Map<String, dynamic> _$$JobImplToJson(_$JobImpl instance) => <String, dynamic>{
  'id': instance.id,
  'job_type': instance.jobType,
  'status': instance.status,
  'params': instance.params,
  'result': instance.result,
  'error_message': instance.errorMessage,
  'created_at': instance.createdAt.toIso8601String(),
  'started_at': instance.startedAt?.toIso8601String(),
  'completed_at': instance.completedAt?.toIso8601String(),
};
