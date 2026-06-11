from app import app, db, User, Category, Product, Client, Transaction, Rental
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def seed_database():
    with app.app_context():
        print("Начинаю очистку и заполнение базы данных...")
        
        # 1. Очистка старых данных
        db.drop_all()
        db.create_all()

        # 2. Создание пользователей
        admin = User(
            username='admin', 
            password_hash=generate_password_hash('admin123'), 
            role='admin'
        )
        manager = User(
            username='manager', 
            password_hash=generate_password_hash('manager123'), 
            role='manager'
        )
        db.session.add_all([admin, manager])

        # 3. Создание категорий
        cat_laptop = Category(name='Ноутбуки')
        cat_monitor = Category(name='Мониторы')
        cat_acc = Category(name='Периферия и Аксессуары')
        db.session.add_all([cat_laptop, cat_monitor, cat_acc])
        db.session.commit()

        # 4. Создание клиентов (сотрудников)
        clients = [
            Client(name='Алексей Иванов', phone='+7 (701) 111-22-33', email='ivanov@company.com', department='IT Отдел'),
            Client(name='Марина Серикова', phone='+7 (702) 444-55-66', email='serikova@company.com', department='HR'),
            Client(name='Данияр Кусаинов', phone='+7 (777) 888-99-00', email='kusainov@company.com', department='Маркетинг'),
            Client(name='Елена Власова', phone='+7 (705) 123-45-67', email='vlasova@company.com', department='Бухгалтерия'),
        ]
        db.session.add_all(clients)
        db.session.commit()

        # 5. Создание товаров (Ноутбуки и Мониторы)
        products = [
            # Ноутбуки
            Product(name='MacBook Pro 14" M2', category_id=cat_laptop.id, serial_number='APPLE-MBP-2023-01', condition='new', status='rented', price=1200000),
            Product(name='Lenovo ThinkPad X1 Carbon', category_id=cat_laptop.id, serial_number='LNV-TP-X1-9982', condition='used', status='in_stock', price=850000),
            Product(name='ASUS Zenbook S13', category_id=cat_laptop.id, serial_number='ASUS-ZB-7712', condition='repair', status='in_stock', price=550000),
            Product(name='Dell Latitude 5420', category_id=cat_laptop.id, serial_number='DELL-LAT-5420-SN', condition='used', status='rented', price=450000),
            Product(name='HP EliteBook 840', category_id=cat_laptop.id, serial_number='HP-EB-840-G8', condition='new', status='in_stock', price=620000),
            
            # Мониторы
            Product(name='Dell UltraSharp 27"', category_id=cat_monitor.id, serial_number='DELL-MON-27-001', condition='new', status='rented', price=250000),
            Product(name='LG 34" UltraWide', category_id=cat_monitor.id, serial_number='LG-UW-34-ABC', condition='new', status='in_stock', price=320000),
            Product(name='Samsung Odyssey G7', category_id=cat_monitor.id, serial_number='SAM-G7-991', condition='used', status='in_stock', price=280000),
        ]
        db.session.add_all(products)
        db.session.commit()

        # 6. Создание активных аренды (связываем клиентов и товары)
        rentals = [
            Rental(
                product_id=products[0].id, # MacBook
                client_id=clients[0].id,   # Алексей (IT)
                expected_return=datetime.now() + timedelta(days=30),
                status='active'
            ),
            Rental(
                product_id=products[3].id, # Dell Lat
                client_id=clients[2].id,   # Данияр (Маркетинг)
                expected_return=datetime.now() + timedelta(days=14),
                status='active'
            ),
            Rental(
                product_id=products[5].id, # Монитор Dell
                client_id=clients[0].id,   # Алексей (IT)
                expected_return=datetime.now() + timedelta(days=60),
                status='active'
            )
        ]
        db.session.add_all(rentals)

        # 7. Заполнение истории (Транзакций) для графиков
        # Добавляем случайные транзакции за последние 5 дней
        actions = ['add', 'rent', 'status_change', 'return']
        for i in range(15):
            random_day = datetime.now() - timedelta(days=random.randint(0, 6))
            log = Transaction(
                product_id=random.choice(products).id,
                action=random.choice(actions),
                user='admin',
                details='Автоматическая генерация данных для теста',
                timestamp=random_day
            )
            db.session.add(log)

        db.session.commit()
        print("=========================================")
        print(" БАЗА ДАННЫХ УСПЕШНО НАПОЛНЕНА!")
        print(f" Создано категорий: {len([cat_laptop, cat_monitor, cat_acc])}")
        print(f" Создано товаров: {len(products)}")
        print(f" Создано клиентов: {len(clients)}")
        print(f" Создано активных выдач: {len(rentals)}")
        print("=========================================")

if __name__ == '__main__':
    seed_database()
