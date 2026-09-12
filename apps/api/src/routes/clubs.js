import express from 'express';
import Club from '../models/Club.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Seed initial default club if none exist
const ensureDefaultClub = async () => {
  try {
    const count = await Club.countDocuments();
    if (count === 0) {
      const adminUser = await User.findOne();
      if (adminUser) {
        await Club.create({
          name: 'Rec Banda Coding Club',
          slug: 'rec-banda-coding-club',
          description: 'Official competitive coding and algorithmic battle club of REC Banda.',
          icon: '💻',
          location: 'REC Banda, India',
          owner: adminUser._id,
          members: [
            { user: adminUser._id, role: 'owner' }
          ]
        });
      }
    }
  } catch (err) {
    console.error('Error ensuring default club:', err);
  }
};
ensureDefaultClub();

// @route   GET /api/clubs
// @desc    Get all clubs with search / filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, username } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (username) {
      const targetUser = await User.findOne({ username: username.toLowerCase() });
      if (targetUser) {
        query['members.user'] = targetUser._id;
      } else {
        return res.json([]);
      }
    }

    const clubs = await Club.find(query)
      .populate('owner', 'username displayName ratings')
      .populate('members.user', 'username displayName ratings')
      .sort({ createdAt: -1 });

    const formatted = clubs.map(club => ({
      id: club._id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      icon: club.icon,
      location: club.location,
      owner: club.owner ? {
        id: club.owner._id,
        username: club.owner.username,
        displayName: club.owner.displayName || club.owner.username
      } : null,
      membersCount: club.members.length,
      members: club.members.map(m => ({
        userId: m.user?._id,
        username: m.user?.username,
        displayName: m.user?.displayName || m.user?.username,
        ratings: m.user?.ratings,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      createdAt: club.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ message: 'Server error fetching clubs' });
  }
});

// @route   GET /api/clubs/:idOrSlug
// @desc    Get specific club details
// @access  Public
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let club;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      club = await Club.findById(idOrSlug)
        .populate('owner', 'username displayName ratings bio countryFlag')
        .populate('members.user', 'username displayName ratings bio countryFlag');
    } else {
      club = await Club.findOne({ slug: idOrSlug.toLowerCase() })
        .populate('owner', 'username displayName ratings bio countryFlag')
        .populate('members.user', 'username displayName ratings bio countryFlag');
    }

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({
      id: club._id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      icon: club.icon,
      location: club.location,
      owner: club.owner,
      membersCount: club.members.length,
      members: club.members.map(m => ({
        userId: m.user?._id,
        username: m.user?.username,
        displayName: m.user?.displayName || m.user?.username,
        ratings: m.user?.ratings,
        countryFlag: m.user?.countryFlag,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      createdAt: club.createdAt
    });
  } catch (err) {
    console.error('Error fetching club:', err);
    res.status(500).json({ message: 'Server error fetching club' });
  }
});

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, icon, location } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Club name must be at least 2 characters.' });
    }

    const existing = await Club.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ message: 'A club with this name already exists.' });
    }

    const club = await Club.create({
      name: name.trim(),
      description: description?.trim() || 'A community of passionate competitive programmers.',
      icon: icon?.trim() || '💻',
      location: location?.trim() || 'Global',
      owner: req.user._id,
      members: [
        { user: req.user._id, role: 'owner' }
      ]
    });

    const populated = await Club.findById(club._id)
      .populate('owner', 'username displayName ratings')
      .populate('members.user', 'username displayName ratings');

    res.status(201).json({
      id: populated._id,
      name: populated.name,
      slug: populated.slug,
      description: populated.description,
      icon: populated.icon,
      location: populated.location,
      owner: populated.owner,
      membersCount: populated.members.length,
      members: populated.members
    });
  } catch (err) {
    console.error('Error creating club:', err);
    res.status(500).json({ message: err.message || 'Server error creating club' });
  }
});

// @route   POST /api/clubs/:id/join
// @desc    Join a club
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const isMember = club.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this club.' });
    }

    club.members.push({ user: req.user._id, role: 'member' });
    await club.save();

    res.json({ message: 'Successfully joined club!', membersCount: club.members.length });
  } catch (err) {
    console.error('Error joining club:', err);
    res.status(500).json({ message: 'Server error joining club' });
  }
});

// @route   POST /api/clubs/:id/leave
// @desc    Leave a club
// @access  Private
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (club.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Club owners cannot leave their own club. You can delete the club instead.' });
    }

    club.members = club.members.filter(m => m.user.toString() !== req.user._id.toString());
    await club.save();

    res.json({ message: 'Successfully left club', membersCount: club.members.length });
  } catch (err) {
    console.error('Error leaving club:', err);
    res.status(500).json({ message: 'Server error leaving club' });
  }
});

// @route   POST /api/clubs/:id/members
// @desc    Add member to club (Owner or Admin only)
// @access  Private
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Verify caller is owner or admin
    const callerRole = club.members.find(m => m.user.toString() === req.user._id.toString())?.role;
    if (club.owner.toString() !== req.user._id.toString() && callerRole !== 'admin') {
      return res.status(403).json({ message: 'Only club owners or admins can add members.' });
    }

    const targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: `User "@${username}" not found.` });
    }

    const isMember = club.members.some(m => m.user.toString() === targetUser._id.toString());
    if (isMember) {
      return res.status(400).json({ message: `@${targetUser.username} is already a member.` });
    }

    club.members.push({ user: targetUser._id, role: 'member' });
    await club.save();

    const updatedClub = await Club.findById(club._id)
      .populate('members.user', 'username displayName ratings bio countryFlag');

    res.json({
      message: `Added @${targetUser.username} to the club!`,
      members: updatedClub.members.map(m => ({
        userId: m.user?._id,
        username: m.user?.username,
        displayName: m.user?.displayName || m.user?.username,
        ratings: m.user?.ratings,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ message: 'Server error adding member' });
  }
});

// @route   DELETE /api/clubs/:id/members/:userId
// @desc    Remove member from club (Owner or Admin only)
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Verify caller is owner or admin
    const callerRole = club.members.find(m => m.user.toString() === req.user._id.toString())?.role;
    if (club.owner.toString() !== req.user._id.toString() && callerRole !== 'admin') {
      return res.status(403).json({ message: 'Only club owners or admins can remove members.' });
    }

    if (club.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the club owner.' });
    }

    club.members = club.members.filter(m => m.user.toString() !== req.params.userId);
    await club.save();

    res.json({ message: 'Member removed successfully', membersCount: club.members.length });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ message: 'Server error removing member' });
  }
});

// @route   DELETE /api/clubs/:id
// @desc    Delete a club (Owner only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (club.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the club owner can delete this club.' });
    }

    await Club.findByIdAndDelete(req.params.id);
    res.json({ message: 'Club deleted successfully.' });
  } catch (err) {
    console.error('Error deleting club:', err);
    res.status(500).json({ message: 'Server error deleting club' });
  }
});

export default router;
