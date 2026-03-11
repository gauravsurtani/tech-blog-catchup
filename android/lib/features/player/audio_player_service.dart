import 'package:just_audio/just_audio.dart';
import '../../core/env.dart';
import '../../models/post.dart';

class AudioPlayerService {
  AudioPlayerService() : _player = AudioPlayer();

  final AudioPlayer _player;

  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<bool> get playingStream => _player.playingStream;
  Stream<ProcessingState> get processingStateStream =>
      _player.processingStateStream;

  Future<void> play(Post post) async {
    final path = post.audioPath;
    if (path == null || path.contains('..') || !path.startsWith('audio/')) {
      throw ArgumentError('Invalid audio path: $path');
    }
    final url = '${AppEnv.baseUrl}/$path';
    await _player.setUrl(url);
    await _player.play();
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> resume() async {
    await _player.play();
  }

  Future<void> stop() async {
    await _player.stop();
  }

  Future<void> seekTo(Duration position) async {
    await _player.seek(position);
  }

  Future<void> seekForward() async {
    final current = _player.position;
    final target = current + const Duration(seconds: 10);
    final max = _player.duration ?? Duration.zero;
    await _player.seek(target > max ? max : target);
  }

  Future<void> seekBackward() async {
    final current = _player.position;
    final target = current - const Duration(seconds: 10);
    await _player.seek(target < Duration.zero ? Duration.zero : target);
  }

  Future<void> setVolume(double volume) async {
    await _player.setVolume(volume);
  }

  Future<void> setPlaybackRate(double rate) async {
    await _player.setSpeed(rate);
  }

  Future<void> dispose() async {
    await _player.dispose();
  }
}
