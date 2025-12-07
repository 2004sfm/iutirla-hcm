from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from email.mime.image import MIMEImage
import os

def send_status_change_email(candidate, new_stage):
    """
    Envía un correo electrónico al candidato notificando el cambio de estado.
    """
    subject = f"Actualización de tu aplicación: {candidate.job_posting.title}"
    
    # Mapeo de etapas a mensajes amigables
    stage_messages = {
        'REV': 'Tu aplicación ha sido revisada y hemos avanzado a la etapa de Revisión.',
        'INT': 'Nos gustaría invitarte a una entrevista para conocerte mejor.',
        'OFF': '¡Felicidades! Queremos hacerte una oferta formal para unirte a nuestro equipo.',
        'HIRED': '¡Bienvenido al equipo! Has sido contratado exitosamente.',
        'REJ': 'Gracias por tu interés en IUTIRLA. En esta ocasión hemos decidido avanzar con otros candidatos, pero mantendremos tu perfil en cuenta para futuras oportunidades.',
        'POOL': 'Has sido seleccionado para nuestro Banco de Elegibles. Te contactaremos cuando se abra una vacante que se ajuste a tu perfil.',
    }
    
    stage_message = stage_messages.get(new_stage, f"Tu aplicación ha cambiado al estado: {new_stage}")
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px; }}
            .logo {{ max-width: 150px; height: auto; }}
            .content {{ padding: 0 10px; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #888; }}
            .button {{ display: inline-block; padding: 10px 20px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logoiutirla" alt="IUTIRLA Logo" class="logo">
            </div>
            <div class="content">
                <h2>Hola, {candidate.first_name}</h2>
                <p>{stage_message}</p>
                <p>Agradecemos tu interés en formar parte de nuestra institución.</p>
                <p>Si tienes alguna duda, por favor no dudes en contactarnos.</p>
            </div>
            <div class="footer">
                <p>&copy; <a href="https://iutirlaoficial.com/" style="color: inherit; text-decoration: none;">iutirlaoficial.com</a>. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Hola {candidate.first_name},
    
    {stage_message}
    
    Saludos,
    Equipo de RRHH - IUTIRLA
    """
    
    recipient_list = [candidate.email]
    
    try:
        msg = EmailMultiAlternatives(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list
        )
        msg.attach_alternative(html_message, "text/html")
        
        # Adjuntar logo
        # Ruta asumiendo estructura: backend/ats/utils.py -> backend/ -> ../frontend/public/logoiutirla.png
        # Ajustamos la ruta base para llegar al frontend
        base_dir = settings.BASE_DIR # backend/
        logo_path = os.path.join(base_dir.parent, 'frontend2', 'public', 'email-logoiutirla.webp')
        
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo_data = f.read()
                logo = MIMEImage(logo_data)
                logo.add_header('Content-ID', '<logoiutirla>')
                logo.add_header('Content-Disposition', 'inline', filename='email-logoiutirla.webp')
                msg.attach(logo)
        else:
            print(f"Logo not found at {logo_path}")
            
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Error sending email to {candidate.email}: {e}")
        return False
