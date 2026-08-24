import request from 'supertest';
import { TextElement, ImageElement } from '../models/DocumentElement.js';
import { Document } from '../models/Document.js';
import { DocumentEditor } from '../services/DocumentEditor.js';
import { SaveToDB } from '../persistence/SaveToDB.js';
import app from '../server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB = path.join(__dirname, 'test_db.json');

describe('Collaborative Document Editor Core Architecture & Diagram Tests', () => {
  let saveToDB;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    saveToDB = new SaveToDB(TEST_DB);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  test('DocumentElement subclass polymorphic rendering (TextElement & ImageElement)', () => {
    const textEl = new TextElement({
      content: 'Hello World',
      heading: 'h1',
      bold: true,
      italic: false
    });
    const renderedText = textEl.render();

    expect(renderedText.type).toBe('text');
    expect(renderedText.html).toContain('<h1 style="text-align: left"><strong>Hello World</strong></h1>');

    const imgEl = new ImageElement({
      url: 'https://example.com/logo.png',
      caption: 'Ajaia Logo'
    });
    const renderedImg = imgEl.render();

    expect(renderedImg.type).toBe('image');
    expect(renderedImg.html).toContain('<img src="https://example.com/logo.png"');
    expect(renderedImg.html).toContain('Ajaia Logo');
  });

  test('DocumentEditor controller operates on vector<DocumentElement>, saves, and renders composite doc', async () => {
    const doc = new Document({ title: 'Architecture Test Doc', ownerId: 'user_alice' });
    const editor = new DocumentEditor(doc, saveToDB);

    editor.addText('First paragraph of text', { heading: 'h2' });
    editor.addImage('https://example.com/diagram.png', 'Backend Architecture Diagram');

    expect(doc.elements.length).toBe(2);

    await editor.save();

    const loadedDoc = await saveToDB.load(doc.id);
    expect(loadedDoc).not.toBeNull();
    expect(loadedDoc.title).toBe('Architecture Test Doc');
    expect(loadedDoc.elements.length).toBe(2);

    const rendered = editor.renderDoc();
    expect(rendered.elements.length).toBe(2);
    expect(rendered.html).toContain('<h2 style="text-align: left">First paragraph of text</h2>');
    expect(rendered.html).toContain('Backend Architecture Diagram');
  });

  test('API Endpoint GET /api/users returns seeded users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test('API Document Lifecycle and Sharing Permission Flow', async () => {
    // 1. Create Document as Alice
    const createRes = await request(app)
      .post('/api/documents')
      .send({ title: 'Shared Strategy Doc', ownerId: 'user_alice' });
    
    expect(createRes.status).toBe(201);
    const docId = createRes.body.document.id;

    // 2. Share with Bob as Editor
    const shareRes = await request(app)
      .post(`/api/documents/${docId}/share?userId=user_alice`)
      .send({ targetUserId: 'user_bob', role: 'editor' });
    expect(shareRes.status).toBe(200);

    // 3. Bob can edit document
    const bobEditRes = await request(app)
      .put(`/api/documents/${docId}?userId=user_bob`)
      .send({ title: 'Shared Strategy Doc (Updated by Bob)', elements: [] });
    expect(bobEditRes.status).toBe(200);

    // 4. Share with Charlie as Viewer
    await request(app)
      .post(`/api/documents/${docId}/share?userId=user_alice`)
      .send({ targetUserId: 'user_charlie', role: 'viewer' });

    // 5. Charlie tries to edit -> 403 Access Denied
    const charlieEditRes = await request(app)
      .put(`/api/documents/${docId}?userId=user_charlie`)
      .send({ title: 'Charlie Hack' });
    expect(charlieEditRes.status).toBe(403);
  });
});
