const router = require('express').Router();
const {
  sendRequest,
  getRequests,
  respondRequest,
  cancelRequest,
  getConnections,
  removeConnection,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getConnections);
router.post('/request', sendRequest);
router.get('/requests', getRequests);
router.put('/respond/:id', respondRequest);
router.delete('/request/:id', cancelRequest);
router.delete('/:userId', removeConnection);

module.exports = router;
