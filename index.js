require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { ApolloServer } = require('apollo-server-express');
const { connectDB } = require('./config/db');
const cloudinary = require('./config/cloudinary');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const PORT = process.env.PORT || 4000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

async function start() {
  await connectDB();

  const app = express();

  // REST endpoint: upload employee profile picture to Cloudinary
  app.post(
    '/api/upload',
    upload.single('photo'),
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Send a field named "photo".' });
      }
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(503).json({ error: 'Cloudinary is not configured. Set CLOUDINARY_* env vars.' });
      }
      try {
        const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(b64, {
          folder: 'employee-photos',
          resource_type: 'image',
        });
        return res.json({ url: result.secure_url });
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ error: err.message || 'Upload failed' });
      }
    }
  );

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(PORT, () => {
    console.log(`Server at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
