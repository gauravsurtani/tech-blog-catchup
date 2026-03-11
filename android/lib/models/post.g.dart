// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PostImpl _$$PostImplFromJson(Map<String, dynamic> json) => _$PostImpl(
  id: (json['id'] as num).toInt(),
  url: json['url'] as String,
  sourceKey: json['source_key'] as String,
  sourceName: json['source_name'] as String,
  title: json['title'] as String,
  summary: json['summary'] as String?,
  author: json['author'] as String?,
  publishedAt: json['published_at'] == null
      ? null
      : DateTime.parse(json['published_at'] as String),
  tags:
      (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  audioStatus: json['audio_status'] as String? ?? 'pending',
  audioPath: json['audio_path'] as String?,
  audioDurationSecs: (json['audio_duration_secs'] as num?)?.toInt(),
  wordCount: (json['word_count'] as num?)?.toInt(),
);

Map<String, dynamic> _$$PostImplToJson(_$PostImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'url': instance.url,
      'source_key': instance.sourceKey,
      'source_name': instance.sourceName,
      'title': instance.title,
      'summary': instance.summary,
      'author': instance.author,
      'published_at': instance.publishedAt?.toIso8601String(),
      'tags': instance.tags,
      'audio_status': instance.audioStatus,
      'audio_path': instance.audioPath,
      'audio_duration_secs': instance.audioDurationSecs,
      'word_count': instance.wordCount,
    };

_$PostDetailImpl _$$PostDetailImplFromJson(Map<String, dynamic> json) =>
    _$PostDetailImpl(
      id: (json['id'] as num).toInt(),
      url: json['url'] as String,
      sourceKey: json['source_key'] as String,
      sourceName: json['source_name'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String?,
      author: json['author'] as String?,
      publishedAt: json['published_at'] == null
          ? null
          : DateTime.parse(json['published_at'] as String),
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const [],
      audioStatus: json['audio_status'] as String? ?? 'pending',
      audioPath: json['audio_path'] as String?,
      audioDurationSecs: (json['audio_duration_secs'] as num?)?.toInt(),
      wordCount: (json['word_count'] as num?)?.toInt(),
      fullText: json['full_text'] as String?,
      qualityScore: (json['quality_score'] as num?)?.toInt(),
      extractionMethod: json['extraction_method'] as String?,
      crawledAt: json['crawled_at'] == null
          ? null
          : DateTime.parse(json['crawled_at'] as String),
    );

Map<String, dynamic> _$$PostDetailImplToJson(_$PostDetailImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'url': instance.url,
      'source_key': instance.sourceKey,
      'source_name': instance.sourceName,
      'title': instance.title,
      'summary': instance.summary,
      'author': instance.author,
      'published_at': instance.publishedAt?.toIso8601String(),
      'tags': instance.tags,
      'audio_status': instance.audioStatus,
      'audio_path': instance.audioPath,
      'audio_duration_secs': instance.audioDurationSecs,
      'word_count': instance.wordCount,
      'full_text': instance.fullText,
      'quality_score': instance.qualityScore,
      'extraction_method': instance.extractionMethod,
      'crawled_at': instance.crawledAt?.toIso8601String(),
    };
