<?php
// Global leaderboard API: skorlari user_bilgisi/scores.json dosyasinda tutar.
// GET = liste dondurur, POST = yeni skor ekler (name, score, kills, time).
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$file = __DIR__ . '/scores.json';
$maxEntries = 100;

function readScores($path) {
  if (!file_exists($path)) return [];
  $raw = @file_get_contents($path);
  if ($raw === false) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function writeScores($path, $list) {
  return @file_put_contents($path, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $list = readScores($file);
  echo json_encode($list);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = file_get_contents('php://input');
  $entry = json_decode($body, true);
  if (!is_array($entry)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
  }
  $name = isset($entry['name']) ? trim(mb_substr((string)$entry['name'], 0, 20)) : 'Oyuncu';
  $score = isset($entry['score']) ? (int)$entry['score'] : 0;
  $kills = isset($entry['kills']) ? (int)$entry['kills'] : 0;
  $time = isset($entry['time']) ? (float)$entry['time'] : 0;
  $list = readScores($file);
  $list[] = ['name' => $name, 'score' => $score, 'kills' => $kills, 'time' => $time, 'date' => time()];
  usort($list, function ($a, $b) { return ($b['score'] ?? 0) - ($a['score'] ?? 0); });
  $list = array_slice($list, 0, $GLOBALS['maxEntries']);
  if (!writeScores($file, $list)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Write failed']);
    exit;
  }
  echo json_encode(['ok' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
