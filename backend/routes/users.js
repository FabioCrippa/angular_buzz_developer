const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Obter dados do usuário atual
router.get('/me', authMiddleware, (req, res) => {
  try {
    // Buscar usuário do banco (simulado)
    const user = {
      id: req.user.id,
      email: req.user.email,
      name: 'Usuário',
      isPremium: false
    };

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar status premium
router.patch('/premium', authMiddleware, (req, res) => {
  try {
    const { isPremium } = req.body;

    // Atualizar no banco (simulado)
    res.json({ 
      message: 'Status premium atualizado',
      isPremium 
    });
  } catch (error) {
    console.error('Update premium error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status premium' });
  }
});

module.exports = router;
