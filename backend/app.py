from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import os
import io
import openpyxl # Для Excel
from reportlab.pdfgen import canvas # Для PDF
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS  # Убедись, что эта строчка есть в импортах
from flask_sqlalchemy import SQLAlchemy
# ... остальные импорты

app = Flask(__name__)

# ДОБАВЬ ЭТУ СТРОЧКУ ПРЯМО ЗДЕСЬ (разрешает доступ с любых адресов)
CORS(app, resources={r"/*": {"origins": "*"}})

# ... весь остальной код (конфиги, маршруты) остаётся без изменений

# ==========================================
# 1. КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
# ==========================================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory_pro_v2.db' # Новая БД, так как структура изменилась
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'diploma-secret-key-2024-super-secure'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ==========================================
# 2. ДЕКОРАТОРЫ ПРАВ ДОСТУПА (РОЛИ)
# ==========================================
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_username = get_jwt_identity()
            user = User.query.filter_by(username=current_username).first()
            if not user or user.role != 'admin':
                return jsonify({"msg": "Доступ запрещен. Требуются права Администратора."}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# ==========================================
# 3. МОДЕЛИ БАЗЫ ДАННЫХ
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='manager') # 'admin' или 'manager'

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100))
    department = db.Column(db.String(100)) # Отдел (если это выдача сотрудникам)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    rentals = db.relationship('Rental', backref='client', lazy=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "phone": self.phone, 
            "email": self.email, "department": self.department
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)
    
    def to_dict(self):
        return {"id": self.id, "name": self.name}

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    serial_number = db.Column(db.String(100), unique=True) # Для ноутбуков/мониторов критично!
    condition = db.Column(db.String(50), default='new') # 'new', 'used', 'repair', 'written_off'
    status = db.Column(db.String(50), default='in_stock') # 'in_stock', 'rented'
    price = db.Column(db.Float, default=0.0)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category_name": self.category.name if self.category else "-",
            "serial_number": self.serial_number,
            "condition": self.condition,
            "status": self.status,
            "price": self.price
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    action = db.Column(db.String(50), nullable=False) # 'add', 'status_change', 'rent', 'return'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.Column(db.String(50), nullable=False)
    details = db.Column(db.String(255)) # Доп инфа (например, "Переведен в ремонт")

class Rental(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    rented_at = db.Column(db.DateTime, default=datetime.utcnow)
    expected_return = db.Column(db.DateTime, nullable=False)
    returned_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='active') # 'active', 'returned'
    
    product = db.relationship('Product')

    def to_dict(self):
        return {
            "id": self.id,
            "product_name": self.product.name,
            "serial_number": self.product.serial_number,
            "client_name": self.client.name,
            "client_phone": self.client.phone,
            "rented_at": self.rented_at.strftime('%Y-%m-%d %H:%M'),
            "expected_return": self.expected_return.strftime('%Y-%m-%d'),
            "status": self.status
        }

# ==========================================
# 4. АВТОРИЗАЦИЯ И СТАТИСТИКА
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity=user.username)
        return jsonify(token=access_token, role=user.role, username=user.username), 200
    return jsonify({"msg": "Неверный логин или пароль"}), 401

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    # Админы видят деньги, менеджеры - нет (сделаем проверку на клиенте)
    total_items = Product.query.count()
    in_stock = Product.query.filter_by(status='in_stock').count()
    in_repair = Product.query.filter_by(condition='repair').count()
    total_value = sum(p.price for p in Product.query.filter(Product.condition != 'written_off').all())
    
    return jsonify({
        "total_items": total_items,
        "in_stock": in_stock,
        "in_repair": in_repair,
        "total_value": total_value,
        "recent_operations": [{"id": t.id, "action": t.action, "details": t.details, "user": t.user, "time": t.timestamp.strftime('%H:%M')} for t in Transaction.query.order_by(Transaction.timestamp.desc()).limit(5).all()]
    }), 200

# ==========================================
# 5. КЛИЕНТЫ (CRM)
# ==========================================
@app.route('/api/clients', methods=['GET', 'POST'])
@jwt_required()
def handle_clients():
    if request.method == 'GET':
        return jsonify([c.to_dict() for c in Client.query.all()]), 200

    if request.method == 'POST':
        data = request.get_json()
        new_client = Client(name=data['name'], phone=data['phone'], email=data.get('email'), department=data.get('department'))
        db.session.add(new_client)
        db.session.commit()
        return jsonify(new_client.to_dict()), 201

# ==========================================
# 6. ТОВАРЫ (ПОИСК, ФИЛЬТРЫ, СТАТУСЫ)
# ==========================================
@app.route('/api/products', methods=['GET', 'POST'])
@jwt_required()
def handle_products():
    if request.method == 'GET':
        # Реализация поиска и фильтрации
        search_query = request.args.get('search', '')
        status_filter = request.args.get('status', '')
        condition_filter = request.args.get('condition', '')

        query = Product.query
        
        if search_query:
            query = query.filter((Product.name.ilike(f'%{search_query}%')) | (Product.serial_number.ilike(f'%{search_query}%')))
        if status_filter:
            query = query.filter_by(status=status_filter)
        if condition_filter:
            query = query.filter_by(condition=condition_filter)

        products = query.all()
        return jsonify([p.to_dict() for p in products]), 200

    if request.method == 'POST':
        current_user = get_jwt_identity()
        data = request.get_json()
        
        new_product = Product(
            name=data['name'], category_id=data['category_id'],
            serial_number=data.get('serial_number'),
            condition=data.get('condition', 'new'),
            price=data.get('price', 0.0)
        )
        db.session.add(new_product)
        
        # Лог
        db.session.add(Transaction(product_id=new_product.id, action='add', user=current_user, details=f"Добавлен {new_product.name}"))
        db.session.commit()
        return jsonify(new_product.to_dict()), 201

@app.route('/api/products/<int:id>/status', methods=['PUT'])
@jwt_required()
def change_product_status(id):
    # Изменение состояния (Например, отправка в ремонт)
    data = request.get_json()
    product = Product.query.get_or_404(id)
    product.condition = data.get('condition', product.condition)
    db.session.add(Transaction(product_id=product.id, action='status_change', user=get_jwt_identity(), details=f"Состояние изменено на {product.condition}"))
    db.session.commit()
    return jsonify({"msg": "Статус обновлен"}), 200

@app.route('/api/products/<int:id>', methods=['DELETE'])
@admin_required() # ТОЛЬКО АДМИН
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.add(Transaction(action='delete', user=get_jwt_identity(), details=f"Удален товар {product.name}"))
    db.session.commit()
    return jsonify({"msg": "Товар удален"}), 200

# ==========================================
# 7. ПРОКАТ И ВЫДАЧА
# ==========================================
@app.route('/api/rentals', methods=['GET', 'POST'])
@jwt_required()
def handle_rentals():
    if request.method == 'GET':
        return jsonify([r.to_dict() for r in Rental.query.order_by(Rental.status.asc()).all()]), 200

    if request.method == 'POST':
        data = request.get_json()
        product = Product.query.get(data['product_id'])
        
        if not product or product.status != 'in_stock' or product.condition in ['repair', 'written_off']:
            return jsonify({"msg": "Товар недоступен для выдачи"}), 400

        product.status = 'rented'
        new_rental = Rental(
            product_id=product.id, client_id=data['client_id'],
            expected_return=datetime.strptime(data['expected_return'], '%Y-%m-%d')
        )
        db.session.add(new_rental)
        db.session.add(Transaction(product_id=product.id, action='rent', user=get_jwt_identity(), details="Выдано клиенту"))
        db.session.commit()
        return jsonify(new_rental.to_dict()), 201

# ==========================================
# 8. ЭКСПОРТ EXCEL И PDF (КИЛЛЕР-ФИЧИ)
# ==========================================
@app.route('/api/export/excel', methods=['GET'])
@admin_required()
def export_excel():
    products = Product.query.all()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Инвентарь"
    
    # Заголовки
    headers = ["ID", "Название", "Категория", "Серийный номер", "Состояние", "Статус", "Цена (KZT)"]
    ws.append(headers)
    
    for p in products:
        ws.append([p.id, p.name, p.category.name if p.category else "", p.serial_number, p.condition, p.status, p.price])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return send_file(output, as_attachment=True, download_name="inventory_report.xlsx", mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

@app.route('/api/export/pdf/<int:rental_id>', methods=['GET'])
@jwt_required()
def export_pdf(rental_id):
    rental = Rental.query.get_or_404(rental_id)
    
    output = io.BytesIO()
    c = canvas.Canvas(output, pagesize=A4)
    
    # В реальном проекте тут нужно подключить шрифт TTF для русского языка
    # c.setFont("Helvetica", 14) 
    
    # Простой PDF на английском (чтобы гарантированно работало без подгрузки шрифтов на защите)
    c.drawString(100, 800, "INVENTORY PRO - EQUIPMENT RENTAL AGREEMENT")
    c.drawString(100, 780, "-" * 50)
    c.drawString(100, 750, f"Rental ID: #{rental.id}")
    c.drawString(100, 730, f"Date: {datetime.utcnow().strftime('%Y-%m-%d')}")
    c.drawString(100, 700, f"Client Name: {rental.client.name}")
    c.drawString(100, 680, f"Client Phone: {rental.client.phone}")
    c.drawString(100, 650, f"Equipment: {rental.product.name}")
    c.drawString(100, 630, f"Serial Number: {rental.product.serial_number}")
    c.drawString(100, 610, f"Expected Return Date: {rental.expected_return.strftime('%Y-%m-%d')}")
    c.drawString(100, 500, "Manager Signature: __________________")
    c.drawString(100, 450, "Client Signature: __________________")
    
    c.showPage()
    c.save()
    output.seek(0)
    
    return send_file(output, as_attachment=True, download_name=f"contract_{rental.id}.pdf", mimetype="application/pdf")

# ==========================================
# 9. ИНИЦИАЛИЗАЦИЯ
# ==========================================
def create_initial_data():
    with app.app_context():
        db.create_all()
        # Создаем Админа
        if not User.query.filter_by(username='admin').first():
            db.session.add(User(username='admin', password_hash=generate_password_hash('admin123'), role='admin'))
        # Создаем Менеджера (с урезанными правами)
        if not User.query.filter_by(username='manager').first():
            db.session.add(User(username='manager', password_hash=generate_password_hash('manager123'), role='manager'))
        
        # Базовые категории для IT
        if not Category.query.first():
            db.session.add_all([Category(name='Ноутбуки'), Category(name='Мониторы'), Category(name='Периферия')])
            
        db.session.commit()
        print("БД ОБНОВЛЕНА. Логины: admin/admin123 (полные права), manager/manager123 (ограничено)")

if __name__ == '__main__':
    create_initial_data()
    app.run(debug=True, host='0.0.0.0', port=5000)
