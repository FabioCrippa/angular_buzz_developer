const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const db = admin.firestore();

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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuário do Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Se não existe, criar documento básico
      const newUser = {
        email: req.user.email,
        name: req.user.name || 'Usuário',
        isPremium: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(userId).set(newUser);
      
      return res.json({ user: { id: userId, ...newUser } });
    }
    
    const userData = userDoc.data();
    res.json({ user: { id: userId, ...userData } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar status premium
router.patch('/premium', authMiddleware, async (req, res) => {
  try {
    const { isPremium } = req.body;
    const userId = req.user.id;

    // Atualizar no Firestore
    await db.collection('users').doc(userId).set({
      isPremium,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ 
      message: 'Status premium atualizado',
      isPremium 
    });
  } catch (error) {
    console.error('Update premium error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status premium' });
  }
});

// Salvar/atualizar perfil do usuário
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, bio, location } = req.body;

    // Validar dados
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const profileData = {
      name: name.trim(),
      phone: phone?.trim() || null,
      bio: bio?.trim() || null,
      location: location?.trim() || null,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Atualizar no Firestore
    await db.collection('users').doc(userId).set(profileData, { merge: true });

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      profile: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Deletar conta do usuário
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🗑️ Deletando conta do usuário:', userId);

    // 1. Deletar subcoleções
    const batch = db.batch();

    // Deletar progresso
    const progressSnapshot = await db.collection('users').doc(userId)
      .collection('progress').get();
    progressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Deletar histórico de quizzes
    const quizHistorySnapshot = await db.collection('users').doc(userId)
      .collection('quizHistory').get();
    quizHistorySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Deletar favoritos
    const favoritesSnapshot = await db.collection('users').doc(userId)
      .collection('favorites').get();
    favoritesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Executar batch delete
    await batch.commit();

    // 2. Deletar assinaturas relacionadas
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId).get();
    
    for (const doc of subscriptionsSnapshot.docs) {
      await doc.ref.delete();
    }

    // 3. Deletar documento do usuário
    await db.collection('users').doc(userId).delete();

    // 4. Deletar da autenticação Firebase
    try {
      await admin.auth().deleteUser(userId);
      console.log('✅ Usuário deletado do Firebase Auth');
    } catch (authError) {
      console.error('⚠️ Erro ao deletar do Auth:', authError);
      // Continuar mesmo se houver erro no Auth
    }

    console.log('✅ Conta deletada com sucesso:', userId);

    res.json({ 
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

module.exports = router;
