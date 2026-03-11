String formatDuration(Duration d) {
  final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
  final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
  return '$minutes:$seconds';
}

String formatDurationFromSeconds(int? seconds) {
  if (seconds == null) return '';
  return formatDuration(Duration(seconds: seconds));
}
