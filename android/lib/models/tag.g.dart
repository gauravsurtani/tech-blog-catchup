// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TagImpl _$$TagImplFromJson(Map<String, dynamic> json) => _$TagImpl(
  name: json['name'] as String,
  slug: json['slug'] as String,
  postCount: (json['post_count'] as num).toInt(),
);

Map<String, dynamic> _$$TagImplToJson(_$TagImpl instance) => <String, dynamic>{
  'name': instance.name,
  'slug': instance.slug,
  'post_count': instance.postCount,
};
