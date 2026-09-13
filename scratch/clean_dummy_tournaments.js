import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/dsa-battle');
  const collection = mongoose.connection.db.collection('tournaments');
  const allTourneys = await collection.find({}).toArray();
  console.log('Found tournaments before cleanup:', allTourneys.length);

  for (const t of allTourneys) {
    const hasDummyParticipant = (t.participants || []).some(p =>
      p.username?.includes('coder_alice') ||
      p.username?.includes('coder_bob') ||
      p.username?.includes('test_') ||
      p.username?.includes('dummy')
    );
    const isDummyTitle = t.title?.includes('520') || t.title?.includes('Test');

    if (hasDummyParticipant || isDummyTitle) {
      await collection.deleteOne({ _id: t._id });
      console.log(`Deleted dummy tournament: "${t.title}" (${t._id})`);
    }
  }

  const remaining = await collection.countDocuments();
  console.log('Remaining tournaments in DB:', remaining);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
