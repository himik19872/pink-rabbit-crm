import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image


def generate_qr_code(data, size=200):
    """Генерация QR-кода для заданных данных"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Изменение размера
    img = img.resize((size, size), Image.LANCZOS)
    
    # Сохранение в BytesIO
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return ContentFile(buffer.getvalue(), name=f"qr_{data[:20]}.png")


def generate_cage_qr(cage_id, address):
    """Генерация QR-кода для клетки"""
    data = f"RABBITCRM:CAGE:{cage_id}:{address}"
    return generate_qr_code(data)


def generate_rabbit_qr(rabbit_id, rabbit_name):
    """Генерация QR-кода для кролика"""
    data = f"RABBITCRM:RABBIT:{rabbit_id}:{rabbit_name}"
    return generate_qr_code(data)
