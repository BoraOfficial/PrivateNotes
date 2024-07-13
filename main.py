from flask import Flask, render_template, request, redirect, url_for, abort, jsonify
import sqlite3
import os
from flask_cors import CORS
import string
import random

def generate_random_text(length):
    characters = string.ascii_letters + string.digits
    random_text = ''.join(random.choice(characters) for _ in range(length))
    return random_text


app = Flask(__name__)


conn = sqlite3.connect('notes.db', check_same_thread=False)

cursor = conn.cursor()

conn.execute('''CREATE TABLE IF NOT EXISTS notes (
                  id TEXT PRIMARY KEY,
                  content TEXT,
                  salt TEXT,
                  iv TEXT  
               )''')

conn.commit()

app.secret_key = os.urandom(24) 


def primary_key_exists(key):
    cursor.execute("""
        SELECT id FROM notes
    """)
    
    result = cursor.fetchone()

    if result == key:
         return True

    
    return False


def get_note(cursor, note_uuid):
    try:
         cursor.execute('''SELECT * FROM notes WHERE id = ?''', (note_uuid,))
         rows = cursor.fetchall()
         return rows
    except Exception as e:
        print("Error:", e)
        return None  # Handle any other exceptions

def delete_note(cursor, note_uuid):
    try:
        cursor.execute('''DELETE FROM notes WHERE id = ?''', (note_uuid,))
        conn.commit()
        return True
    except Exception as e:
        print("Error:", e)
        return False  # Handle any other exceptions

def add_note(content, salt, iv):
   while True:
        uuid = generate_random_text(16)
        if not primary_key_exists(uuid):
            break
        
   print(uuid)

   params = (uuid, content, salt, iv)
    
   cursor.execute("INSERT INTO notes (id, content, salt, iv) VALUES (?, ?, ?, ?)", params)
     
   conn.commit()

   return uuid

@app.route('/')
def home():
	return render_template('index.html')


@app.route('/add_note', methods=['POST'])
def add_note_endpoint():
   r_json = request.json
   content = r_json['content']
   salt = r_json['salt']
   iv = r_json['iv']
   if len(iv) <= 20*4 and len(salt) <= 24*4 and len(content) <= 900:
        uuid = add_note(content, salt, iv)
        return jsonify({'message': 'Note added successfully', 'uuid': uuid}), 201
   else:
       return abort(500)


@app.route('/notes/<note>')
def notes(note):
    try:
        content = get_note(cursor, note)
        delete_note(cursor, note)
        return render_template('note.html', content=content[0][1], salt=content[0][2], iv=content[0][3]) # [0][1] to get the text part instead of getting a tuple of uuid and text
    except:
        return abort(404)

@app.route('/faq')
def faq():
    return render_template('faq.html')


@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

CORS(app, origins=['http://localhost:5000', 'http://127.0.0.1:5000'])

if __name__ == '__main__':
    app.run(debug=False,host='0.0.0.0',port=int(os.environ.get('PORT', 8080))) #host='0.0.0.0',port=int(os.environ.get('PORT', 8080))
