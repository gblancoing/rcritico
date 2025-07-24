<?php
$usuarios = [
    'gblanco@jej.cl' => 'admin123',

];

foreach ($usuarios as $nombre => $clave) {
    echo $nombre . ': ' . password_hash($clave, PASSWORD_DEFAULT) . "<br>";
}
?>
