const router = require('express').Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  getRecommendations,
  getLeaderboard,
  getStats,
  getTrendingSkills,
  adminGetUsers,
  adminDeleteUser,
  adminUpdateUserRole,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(protect);

// Standard user endpoints
router.get('/recommendations', getRecommendations);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getStats);
router.get('/trending-skills', getTrendingSkills);
router.put('/profile', updateProfile);

// Admin-only endpoints
router.get('/admin/users', roleGuard('admin'), adminGetUsers);
router.delete('/admin/:id', roleGuard('admin'), adminDeleteUser);
router.put('/admin/:id/role', roleGuard('admin'), adminUpdateUserRole);

// Parametric routes (must be after specific endpoints)
router.get('/', getUsers);
router.get('/:id', getUserById);

module.exports = router;
