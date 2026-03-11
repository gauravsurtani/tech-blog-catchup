import 'package:freezed_annotation/freezed_annotation.dart';
import 'source.dart';
import 'tag.dart';

part 'status_info.freezed.dart';
part 'status_info.g.dart';

@freezed
class StatusInfo with _$StatusInfo {
  const factory StatusInfo({
    required int totalPosts,
    required List<Source> postsBySource,
    required Map<String, int> audioCounts,
    required List<Tag> tagCounts,
  }) = _StatusInfo;

  factory StatusInfo.fromJson(Map<String, dynamic> json) =>
      _$StatusInfoFromJson(json);
}
