<?php
/**
 * Sistema de envío de emails reales con PHPMailer para Codelco
 * Configurado para usar el servidor SMTP de jej664caren.cl
 */

require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function enviarEmailRecuperacion($email, $nombre, $token) {
    // URL base del sitio
    $base_url = 'http://localhost/pmo';
    $reset_link = $base_url . '/reset-password-fixed.html?token=' . $token;
    
    // Crear instancia de PHPMailer
    $mail = new PHPMailer(true);
    
    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host       = 'mail.jej664caren.cl';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'financiero@jej664caren.cl';
        $mail->Password   = 'Inging1989$';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';
        
        // Configurar remitente y destinatario
        $mail->setFrom('financiero@jej664caren.cl', 'Sistema Codelco');
        $mail->addAddress($email, $nombre);
        $mail->addReplyTo('financiero@jej664caren.cl', 'Sistema Codelco');
        
        // Contenido del email
        $mail->isHTML(true);
        $mail->Subject = 'Recuperación de Contraseña - Sistema Codelco';
        $mail->Body    = crearContenidoEmailHTML($nombre, $reset_link);
        $mail->AltBody = crearContenidoEmailTexto($nombre, $reset_link);
        
        // Enviar email
        $resultado = $mail->send();
        
        // Log del envío exitoso
        $log_entry = date('Y-m-d H:i:s') . " - ✅ EMAIL ENVIADO\n";
        $log_entry .= "Destinatario: $email ($nombre)\n";
        $log_entry .= "Asunto: Recuperación de Contraseña - Sistema Codelco\n";
        $log_entry .= "Enlace: $reset_link\n";
        $log_entry .= "Token: $token\n";
        $log_entry .= "Estado: Enviado correctamente\n";
        $log_entry .= "---\n\n";
        
        file_put_contents('emails_enviados.log', $log_entry, FILE_APPEND);
        
        return true;
        
    } catch (Exception $e) {
        // Log del error
        $log_entry = date('Y-m-d H:i:s') . " - ❌ ERROR EMAIL\n";
        $log_entry .= "Destinatario: $email ($nombre)\n";
        $log_entry .= "Asunto: Recuperación de Contraseña - Sistema Codelco\n";
        $log_entry .= "Enlace: $reset_link\n";
        $log_entry .= "Token: $token\n";
        $log_entry .= "Error: " . $e->getMessage() . "\n";
        $log_entry .= "Estado: Error en envío\n";
        $log_entry .= "---\n\n";
        
        file_put_contents('emails_enviados.log', $log_entry, FILE_APPEND);
        
        return false;
    }
}

function crearContenidoEmailHTML($nombre, $reset_link) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Recuperación de Contraseña - Sistema Codelco</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🔐 Recuperación de Contraseña</h1>
                <p>Sistema Codelco</p>
            </div>
            
            <div class='content'>
                <h2>Hola $nombre,</h2>
                
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema Codelco.</p>
                
                <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
                
                <div style='text-align: center;'>
                    <a href='$reset_link' class='button'>Restablecer Contraseña</a>
                </div>
                
                <div class='warning'>
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este enlace expira en 1 hora</li>
                        <li>Solo puede ser usado una vez</li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                    </ul>
                </div>
                
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style='word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 3px; font-family: monospace;'>$reset_link</p>
                
                <p>Si tienes problemas, contacta al administrador del sistema.</p>
                
                <p>Saludos,<br>Equipo de Sistemas Codelco</p>
            </div>
            
            <div class='footer'>
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                <p>Sistema Codelco - Recuperación de Contraseñas</p>
            </div>
        </div>
    </body>
    </html>";
}

function crearContenidoEmailTexto($nombre, $reset_link) {
    return "
RECUPERACIÓN DE CONTRASEÑA - SISTEMA CODELCO

Hola $nombre,

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema Codelco.

Para restablecer tu contraseña, visita el siguiente enlace:
$reset_link

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puede ser usado una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas, contacta al administrador del sistema.

Saludos,
Equipo de Sistemas Codelco

---
Este es un email automático, por favor no respondas a este mensaje.
Sistema Codelco - Recuperación de Contraseñas";
}

function guardarEmailEnLog($email, $subject, $message, $reset_link, $token, $resultado) {
    $log_entry = date('Y-m-d H:i:s') . " - " . ($resultado ? "✅ EMAIL ENVIADO" : "❌ ERROR EMAIL") . "\n";
    $log_entry .= "Destinatario: $email\n";
    $log_entry .= "Asunto: $subject\n";
    $log_entry .= "Enlace: $reset_link\n";
    $log_entry .= "Token: $token\n";
    $log_entry .= "Estado: " . ($resultado ? "Enviado correctamente" : "Error en envío") . "\n";
    $log_entry .= "---\n\n";
    
    file_put_contents('emails_enviados.log', $log_entry, FILE_APPEND);
}

/**
 * Enviar notificación de tarea próxima a vencer
 */
function enviarNotificacionTarea($email, $nombre, $tarea_titulo, $fecha_vencimiento, $carpeta_nombre, $dias_restantes, $tipo_notificacion = 'vencimiento_proximo') {
    // Crear instancia de PHPMailer
    $mail = new PHPMailer(true);
    
    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host       = 'mail.jej664caren.cl';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'financiero@jej664caren.cl';
        $mail->Password   = 'Inging1989$';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        $mail->CharSet    = 'UTF-8';
        
        // Configurar remitente y destinatario
        $mail->setFrom('financiero@jej664caren.cl', 'Sistema SSO Caren');
        $mail->addAddress($email, $nombre);
        $mail->addReplyTo('financiero@jej664caren.cl', 'Sistema SSO Caren');
        
        // Determinar asunto según tipo de notificación
        $asunto = '';
        $color_alerta = '';
        $mensaje_alerta = '';
        
        if ($tipo_notificacion === 'vencido') {
            $asunto = "⚠️ TAREA VENCIDA: {$tarea_titulo}";
            $color_alerta = '#dc3545';
            $mensaje_alerta = 'Esta tarea ya ha vencido y aún está en proceso.';
        } else if ($tipo_notificacion === 'vencimiento_hoy') {
            $asunto = "🔔 TAREA VENCE HOY: {$tarea_titulo}";
            $color_alerta = '#ff9800';
            $mensaje_alerta = 'Esta tarea vence hoy y aún está en proceso.';
        } else {
            $asunto = "📅 Recordatorio: Tarea próxima a vencer - {$tarea_titulo}";
            $color_alerta = '#ffc107';
            $mensaje_alerta = "Esta tarea vence en {$dias_restantes} día(s) y aún está en proceso.";
        }
        
        // Contenido del email
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = crearContenidoEmailTareaHTML($nombre, $tarea_titulo, $fecha_vencimiento, $carpeta_nombre, $dias_restantes, $color_alerta, $mensaje_alerta);
        $mail->AltBody = crearContenidoEmailTareaTexto($nombre, $tarea_titulo, $fecha_vencimiento, $carpeta_nombre, $dias_restantes, $mensaje_alerta);
        
        // Enviar email
        $resultado = $mail->send();
        
        // Log del envío
        $log_entry = date('Y-m-d H:i:s') . " - " . ($resultado ? "✅ NOTIFICACIÓN TAREA ENVIADA" : "❌ ERROR NOTIFICACIÓN TAREA") . "\n";
        $log_entry .= "Destinatario: $email ($nombre)\n";
        $log_entry .= "Asunto: $asunto\n";
        $log_entry .= "Tarea: $tarea_titulo\n";
        $log_entry .= "Carpeta: $carpeta_nombre\n";
        $log_entry .= "Fecha Vencimiento: $fecha_vencimiento\n";
        $log_entry .= "Días Restantes: $dias_restantes\n";
        $log_entry .= "Tipo: $tipo_notificacion\n";
        $log_entry .= "Estado: " . ($resultado ? "Enviado correctamente" : "Error en envío") . "\n";
        $log_entry .= "---\n\n";
        
        file_put_contents(__DIR__ . '/../notificaciones_tareas.log', $log_entry, FILE_APPEND);
        
        return $resultado;
        
    } catch (Exception $e) {
        // Log del error
        $log_entry = date('Y-m-d H:i:s') . " - ❌ ERROR NOTIFICACIÓN TAREA\n";
        $log_entry .= "Destinatario: $email ($nombre)\n";
        $log_entry .= "Tarea: $tarea_titulo\n";
        $log_entry .= "Error: " . $e->getMessage() . "\n";
        $log_entry .= "---\n\n";
        
        file_put_contents(__DIR__ . '/../notificaciones_tareas.log', $log_entry, FILE_APPEND);
        
        return false;
    }
}

function crearContenidoEmailTareaHTML($nombre, $tarea_titulo, $fecha_vencimiento, $carpeta_nombre, $dias_restantes, $color_alerta, $mensaje_alerta) {
    $fecha_formateada = date('d/m/Y', strtotime($fecha_vencimiento));
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0a6ebd 0%, #005288 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
            .alert-box { background: {$color_alerta}; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .task-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0a6ebd; }
            .task-info p { margin: 10px 0; }
            .task-info strong { color: #0a3265; }
            .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #0a6ebd; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2 style='margin: 0;'>Sistema SSO Caren</h2>
                <p style='margin: 5px 0 0 0;'>Notificación de Tarea</p>
            </div>
            <div class='content'>
                <p>Hola <strong>{$nombre}</strong>,</p>
                
                <div class='alert-box'>
                    {$mensaje_alerta}
                </div>
                
                <div class='task-info'>
                    <p><strong>Tarea:</strong> {$tarea_titulo}</p>
                    <p><strong>Carpeta:</strong> {$carpeta_nombre}</p>
                    <p><strong>Fecha de Vencimiento:</strong> {$fecha_formateada}</p>
                    <p><strong>Días Restantes:</strong> {$dias_restantes} día(s)</p>
                </div>
                
                <p>Por favor, revisa esta tarea y completa las acciones necesarias antes de la fecha de vencimiento.</p>
                
                <p style='text-align: center;'>
                    <a href='http://localhost/ssocaren' class='button'>Acceder al Sistema</a>
                </p>
            </div>
            <div class='footer'>
                <p>Este es un email automático del Sistema SSO Caren.</p>
                <p>Por favor, no respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

function crearContenidoEmailTareaTexto($nombre, $tarea_titulo, $fecha_vencimiento, $carpeta_nombre, $dias_restantes, $mensaje_alerta) {
    $fecha_formateada = date('d/m/Y', strtotime($fecha_vencimiento));
    
    return "
NOTIFICACIÓN DE TAREA - SISTEMA SSO CAREN

Hola {$nombre},

{$mensaje_alerta}

INFORMACIÓN DE LA TAREA:
- Tarea: {$tarea_titulo}
- Carpeta: {$carpeta_nombre}
- Fecha de Vencimiento: {$fecha_formateada}
- Días Restantes: {$dias_restantes} día(s)

Por favor, revisa esta tarea y completa las acciones necesarias antes de la fecha de vencimiento.

Accede al sistema en: http://localhost/ssocaren

---
Este es un email automático del Sistema SSO Caren.
Por favor, no respondas a este mensaje.
    ";
}
?>


