<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'post_data' => $_POST,
    'files' => isset($_FILES['archivo']) ? [
        'name' => $_FILES['archivo']['name'],
        'size' => $_FILES['archivo']['size'],
        'error' => $_FILES['archivo']['error'],
        'tmp_name' => $_FILES['archivo']['tmp_name']
    ] : 'NO FILES',
    'upload_max' => ini_get('upload_max_filesize'),
    'post_max' => ini_get('post_max_size'),
    'tmp_dir' => sys_get_temp_dir(),
    'tmp_writable' => is_writable(sys_get_temp_dir())
];

echo json_encode($debug, JSON_PRETTY_PRINT);