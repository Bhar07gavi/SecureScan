// Sample code snippets for testing the vulnerability scanner
// ⚠️ These contain INTENTIONAL vulnerabilities for testing purposes
// All secrets are FAKE/TEST values - not real credentials

export const sampleJavaScript = `
// ============================================
// SQL INJECTION VULNERABILITIES
// ============================================

function getUserById(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}

function searchUsers(searchTerm) {
  const sql = \`SELECT * FROM users WHERE name LIKE '%\${searchTerm}%'\`;
  db.query(sql);
}

// ============================================
// XSS VULNERABILITIES
// ============================================

function displayUserComment(comment) {
  document.getElementById('comment').innerHTML = comment;
}

function renderHTML(userInput) {
  const html = "<div>" + userInput + "</div>";
  document.write(html);
}

function showMessage(message) {
  const container = document.querySelector('.message');
  container.outerHTML = "<p>" + message + "</p>";
}

// React XSS
function UserProfile({ bio }) {
  return <div dangerouslySetInnerHTML={{ __html: bio }} />;
}

// ============================================
// COMMAND INJECTION VULNERABILITIES
// ============================================

const { exec } = require('child_process');

function runCommand(userInput) {
  exec('ls -la ' + userInput, (error, stdout) => {
    console.log(stdout);
  });
}

function processFile(filename) {
  const cmd = \`cat \${filename}\`;
  exec(cmd);
}

// ============================================
// HARDCODED CREDENTIALS (TEST VALUES ONLY)
// ============================================

const config = {
  apiKey: "TEST_API_KEY_12345",
  secretKey: "TEST_SECRET_KEY_67890",
  password: "TEST_PASSWORD_123",
  dbPassword: "TEST_DB_PASS"
};

const JWT_SECRET = "TEST_JWT_SECRET";
const API_TOKEN = "TEST_API_TOKEN_ABCDEF";

// Database config with test credentials
const dbConfig = {
  host: "localhost",
  user: "testuser",
  password: "TEST_DB_PASSWORD",
  database: "testdb"
};

// ============================================
// PATH TRAVERSAL VULNERABILITIES
// ============================================

const fs = require('fs');

function readUserFile(filename) {
  const content = fs.readFileSync('/uploads/' + filename);
  return content;
}

function loadFile(path) {
  return fs.readFile(__dirname + path, 'utf8');
}

// ============================================
// CODE INJECTION VULNERABILITIES
// ============================================

function executeCode(userCode) {
  eval(userCode);
}

function createFunction(code) {
  const fn = new Function('x', 'return ' + code);
  return fn(10);
}

// ============================================
// WEAK CRYPTOGRAPHY
// ============================================

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function generateToken(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

// ============================================
// INSECURE RANDOM
// ============================================

function generateSessionId() {
  return Math.random().toString(36).substring(2);
}

function createToken() {
  return 'token_' + Math.random();
}

// ============================================
// INSECURE DESERIALIZATION
// ============================================

function loadUserData(serializedData) {
  return JSON.parse(serializedData);
}

// ============================================
// PROTOTYPE POLLUTION
// ============================================

function merge(target, source) {
  for (let key in source) {
    if (key === '__proto__') continue;
    target[key] = source[key];
  }
  return target;
}

// ============================================
// DEBUG STATEMENTS
// ============================================

function processPayment(amount, cardNumber) {
  console.log('Processing payment:', amount, cardNumber);
  debugger;
  return true;
}

// ============================================
// EMPTY EXCEPTION HANDLERS
// ============================================

async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return response.json();
  } catch (error) {
    // Empty catch - bad practice
  }
}

// ============================================
// CORS MISCONFIGURATION
// ============================================

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// ============================================
// SENSITIVE DATA IN LOCAL STORAGE
// ============================================

function saveAuthToken(token) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userPassword', 'TEST_USER_PASSWORD');
}
`;

export const samplePython = `
# ============================================
# SQL INJECTION VULNERABILITIES
# ============================================

import sqlite3

def get_user(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    cursor.execute(query)
    return cursor.fetchone()

def search_products(keyword):
    sql = f"SELECT * FROM products WHERE name LIKE '%{keyword}%'"
    cursor.execute(sql)

def login_user(username, password):
    query = "SELECT * FROM users WHERE username = '%s' AND password = '%s'" % (username, password)
    cursor.execute(query)

# ============================================
# COMMAND INJECTION VULNERABILITIES
# ============================================

import os
import subprocess

def run_ping(host):
    os.system('ping -c 1 ' + host)

def list_directory(path):
    subprocess.call('ls -la ' + path, shell=True)

def process_file(filename):
    cmd = f"cat {filename}"
    os.system(cmd)

# ============================================
# HARDCODED CREDENTIALS (TEST VALUES ONLY)
# ============================================

API_KEY = "TEST_API_KEY_12345"
SECRET_KEY = "TEST_SECRET_KEY_67890"
DB_PASSWORD = "TEST_DB_PASSWORD"
JWT_SECRET = "TEST_JWT_SECRET"

config = {
    "api_key": "TEST_API_KEY",
    "secret": "TEST_SECRET",
    "password": "TEST_PASSWORD"
}

# Database connection with test credentials
db_config = {
    "host": "localhost",
    "user": "testuser",
    "password": "TEST_DB_PASS",
    "database": "testdb"
}

# ============================================
# CODE INJECTION VULNERABILITIES
# ============================================

def execute_user_code(code):
    exec(code)

def evaluate_expression(expr):
    result = eval(expr)
    return result

# ============================================
# WEAK CRYPTOGRAPHY
# ============================================

import hashlib

def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()

def create_token(data):
    return hashlib.sha1(data.encode()).hexdigest()

# ============================================
# INSECURE RANDOM
# ============================================

import random

def generate_session_id():
    return str(random.random())

def create_token():
    return random.randint(1000, 9999)

# ============================================
# PATH TRAVERSAL VULNERABILITIES
# ============================================

def read_file(filename):
    with open('/uploads/' + filename, 'r') as f:
        return f.read()

def load_config(path):
    file_path = '../config/' + path
    with open(file_path) as f:
        return f.read()

# ============================================
# INSECURE DESERIALIZATION
# ============================================

import pickle
import yaml

def load_data(serialized):
    return pickle.loads(serialized)

def parse_yaml(yaml_string):
    return yaml.load(yaml_string)

# ============================================
# EMPTY EXCEPTION HANDLERS
# ============================================

def fetch_data():
    try:
        response = requests.get('https://api.example.com/data')
        return response.json()
    except:
        pass

def process_payment(amount):
    try:
        charge_card(amount)
    except Exception:
        pass

# ============================================
# SENSITIVE DATA IN LOGS
# ============================================

def login(username, password):
    print(f"Login attempt: {username} with password: {password}")
    print(f"API Key: {API_KEY}")

# ============================================
# UNSAFE FILE OPERATIONS
# ============================================

def save_upload(file_data, filename):
    with open(filename, 'wb') as f:
        f.write(file_data)
`;

export const sampleJava = `
// ============================================
// SQL INJECTION VULNERABILITIES
// ============================================

public class UserDAO {
    public User getUserById(String userId) {
        String query = "SELECT * FROM users WHERE id = " + userId;
        return executeQuery(query);
    }
    
    public List<User> searchUsers(String keyword) {
        String sql = "SELECT * FROM users WHERE name LIKE '%" + keyword + "%'";
        return database.query(sql);
    }
}

// ============================================
// COMMAND INJECTION VULNERABILITIES
// ============================================

public class SystemUtils {
    public void executeCommand(String userInput) {
        Runtime.getRuntime().exec("ls -la " + userInput);
    }
    
    public void runScript(String scriptName) {
        String cmd = "sh " + scriptName;
        Runtime.getRuntime().exec(cmd);
    }
}

// ============================================
// HARDCODED CREDENTIALS (TEST VALUES ONLY)
// ============================================

public class Config {
    private static final String API_KEY = "TEST_API_KEY_12345";
    private static final String SECRET_KEY = "TEST_SECRET_KEY_67890";
    private static final String DB_PASSWORD = "TEST_DB_PASSWORD";
    private static final String JWT_SECRET = "TEST_JWT_SECRET";
    
    public static final String DATABASE_URL = "jdbc:mysql://localhost/testdb";
    public static final String DB_USER = "testuser";
    public static final String DB_PASS = "TEST_DB_PASS";
}

// ============================================
// WEAK CRYPTOGRAPHY
// ============================================

import java.security.MessageDigest;

public class CryptoUtils {
    public String hashPassword(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] hash = md.digest(password.getBytes());
        return bytesToHex(hash);
    }
    
    public String generateToken(String data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        return bytesToHex(md.digest(data.getBytes()));
    }
}

// ============================================
// INSECURE RANDOM
// ============================================

import java.util.Random;

public class TokenGenerator {
    private Random random = new Random();
    
    public String generateSessionId() {
        return String.valueOf(random.nextLong());
    }
}

// ============================================
// PATH TRAVERSAL VULNERABILITIES
// ============================================

import java.io.File;

public class FileHandler {
    public String readFile(String filename) {
        File file = new File("/uploads/" + filename);
        return readFileContent(file);
    }
}

// ============================================
// INSECURE DESERIALIZATION
// ============================================

import java.io.ObjectInputStream;

public class DataLoader {
    public Object deserialize(byte[] data) throws Exception {
        ObjectInputStream ois = new ObjectInputStream(
            new ByteArrayInputStream(data)
        );
        return ois.readObject();
    }
}

// ============================================
// EMPTY EXCEPTION HANDLERS
// ============================================

public class PaymentProcessor {
    public void processPayment(double amount) {
        try {
            chargeCard(amount);
        } catch (Exception e) {
            // Empty catch block
        }
    }
}

// ============================================
// SENSITIVE DATA IN LOGS
// ============================================

import java.util.logging.Logger;

public class AuthService {
    private static final Logger logger = Logger.getLogger(AuthService.class.getName());
    
    public void login(String username, String password) {
        logger.info("Login attempt: " + username + " password: " + password);
        logger.info("Using API key: " + API_KEY);
    }
}
`;

export const samplePHP = `
<?php
// ============================================
// SQL INJECTION VULNERABILITIES
// ============================================

function getUser($userId) {
    $query = "SELECT * FROM users WHERE id = " . $userId;
    return mysqli_query($conn, $query);
}

function searchProducts($keyword) {
    $sql = "SELECT * FROM products WHERE name LIKE '%$keyword%'";
    return $db->query($sql);
}

// ============================================
// COMMAND INJECTION VULNERABILITIES
// ============================================

function runCommand($userInput) {
    system('ls -la ' . $userInput);
}

function executeScript($script) {
    exec('sh ' . $script);
}

// ============================================
// HARDCODED CREDENTIALS (TEST VALUES ONLY)
// ============================================

define('API_KEY', 'TEST_API_KEY_12345');
define('SECRET_KEY', 'TEST_SECRET_KEY_67890');
define('DB_PASSWORD', 'TEST_DB_PASSWORD');

$config = array(
    'api_key' => 'TEST_API_KEY',
    'secret' => 'TEST_SECRET',
    'password' => 'TEST_PASSWORD'
);

$db_config = array(
    'host' => 'localhost',
    'user' => 'testuser',
    'password' => 'TEST_DB_PASS',
    'database' => 'testdb'
);

// ============================================
// CODE INJECTION VULNERABILITIES
// ============================================

function evaluateCode($code) {
    eval($code);
}

// ============================================
// WEAK CRYPTOGRAPHY
// ============================================

function hashPassword($password) {
    return md5($password);
}

function createToken($data) {
    return sha1($data);
}

// ============================================
// INSECURE DESERIALIZATION
// ============================================

function loadUserData($serialized) {
    return unserialize($serialized);
}

// ============================================
// PATH TRAVERSAL VULNERABILITIES
// ============================================

function readFile($filename) {
    $path = '/uploads/' . $filename;
    return file_get_contents($path);
}

// ============================================
// XSS VULNERABILITIES
// ============================================

function displayComment($comment) {
    echo "<div>" . $comment . "</div>";
}

function showMessage($message) {
    print $message;
}

// ============================================
// EMPTY EXCEPTION HANDLERS
// ============================================

function processPayment($amount) {
    try {
        chargeCard($amount);
    } catch (Exception $e) {
        // Empty catch
    }
}

// ============================================
// SENSITIVE DATA IN LOGS
// ============================================

function login($username, $password) {
    error_log("Login: $username with password: $password");
    error_log("API Key: " . API_KEY);
}
?>
`;

// For testing multi-file project scans
export const sampleProjectFiles = [
  {
    name: 'auth.js',
    content: `
// Authentication module
const crypto = require('crypto');

const JWT_SECRET = "TEST_JWT_SECRET";

function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function login(username, password) {
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  return db.query(query);
}

module.exports = { hashPassword, login };
    `.trim()
  },
  {
    name: 'api.js',
    content: `
// API routes
const express = require('express');
const router = express.Router();

const API_KEY = "TEST_API_KEY_12345";

router.get('/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.execute(query).then(result => res.json(result));
});

router.post('/search', (req, res) => {
  eval(req.body.code);
  res.send('OK');
});

module.exports = router;
    `.trim()
  },
  {
    name: 'utils.js',
    content: `
// Utility functions
const { exec } = require('child_process');

function runCommand(cmd) {
  exec('sh -c ' + cmd);
}

function generateToken() {
  return Math.random().toString(36);
}

function displayHTML(content) {
  document.getElementById('output').innerHTML = content;
}

module.exports = { runCommand, generateToken, displayHTML };
    `.trim()
  }
];