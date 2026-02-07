/**
 * Action Items E2E Tests
 * ----------------------
 * End-to-end tests for action items endpoints.
 * 
 * Note: These tests require mongodb-memory-server to be installed:
 * npm install --save-dev mongodb-memory-server
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { ActionItemsModule } from '@features/action-items/action-items.module';
import {
  ActionItem,
  ActionItemDocument,
  ActionItemStatus,
} from '@features/action-items/schemas/action-item.schema';
import { UserRole } from '@features/users/entities/user-role.enum';
import { DocumentsModule } from '@features/documents/documents.module';
import { MeetingsModule } from '@features/meetings/meetings.module';
import { UsersModule } from '@features/users/users.module';
import { AuthModule } from '@features/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Skip tests if mongodb-memory-server is not available
let MongoMemoryServer: typeof import('mongodb-memory-server').MongoMemoryServer;
try {
  MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
} catch {
  // mongodb-memory-server not installed
}

const describeOrSkip = MongoMemoryServer ? describe : describe.skip;

describeOrSkip('ActionItemsController (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: InstanceType<typeof MongoMemoryServer>;
  let jwtService: JwtService;
  let actionItemModel: Model<ActionItemDocument>;

  let responsableUserId: Types.ObjectId;
  let chefProjetUserId: Types.ObjectId;
  let consultantUserId: Types.ObjectId;
  let responsableToken: string;
  let chefProjetToken: string;
  let consultantToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Create user IDs
    responsableUserId = new Types.ObjectId();
    chefProjetUserId = new Types.ObjectId();
    consultantUserId = new Types.ObjectId();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              env: {
                jwtSecret: 'test-secret-key-for-testing',
                encryptionKey: 'test-encryption-key-32chars!!',
              },
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        ActionItemsModule,
        DocumentsModule,
        MeetingsModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    actionItemModel = moduleFixture.get<Model<ActionItemDocument>>(
      getModelToken('ActionItem'),
    );

    // Generate JWT tokens for test users
    responsableToken = jwtService.sign({
      sub: responsableUserId.toString(),
      email: 'responsable@test.com',
      role: UserRole.RESPONSABLE,
    });

    chefProjetToken = jwtService.sign({
      sub: chefProjetUserId.toString(),
      email: 'chef@test.com',
      role: UserRole.CHEF_PROJET,
    });

    consultantToken = jwtService.sign({
      sub: consultantUserId.toString(),
      email: 'consultant@test.com',
      role: UserRole.CONSULTANT,
    });
  });

  afterAll(async () => {
    await app?.close();
    await mongoServer?.stop();
  });

  beforeEach(async () => {
    // Clean up action items before each test
    await actionItemModel.deleteMany({});
  });

  describe('POST /action-items', () => {
    it('should allow RESPONSABLE to create action item', async () => {
      const createDto = {
        title: 'Test Action Item',
        description: 'Test description',
      };

      const response = await request(app.getHttpServer())
        .post('/action-items')
        .set('Authorization', `Bearer ${responsableToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.title).toBe(createDto.title);
      expect(response.body.data.status).toBe('TODO');
    });

    it('should allow CHEF_PROJET to create action item', async () => {
      const createDto = {
        title: 'Chef Action Item',
        description: 'Created by chef',
      };

      const response = await request(app.getHttpServer())
        .post('/action-items')
        .set('Authorization', `Bearer ${chefProjetToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.title).toBe(createDto.title);
    });

    it('should deny CONSULTANT from creating action item', async () => {
      const createDto = {
        title: 'Consultant Action Item',
      };

      await request(app.getHttpServer())
        .post('/action-items')
        .set('Authorization', `Bearer ${consultantToken}`)
        .send(createDto)
        .expect(403);
    });

    it('should handle idempotency key', async () => {
      const createDto = { title: 'Idempotent Item' };
      const idempotencyKey = 'unique-key-123';

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/action-items')
        .set('Authorization', `Bearer ${responsableToken}`)
        .set('X-Idempotency-Key', idempotencyKey)
        .send(createDto)
        .expect(201);

      // Second request with same key
      const response2 = await request(app.getHttpServer())
        .post('/action-items')
        .set('Authorization', `Bearer ${responsableToken}`)
        .set('X-Idempotency-Key', idempotencyKey)
        .send(createDto)
        .expect(201);

      // Should return the same item
      expect(response1.body.data._id).toBe(response2.body.data._id);
    });
  });

  describe('GET /action-items', () => {
    it('should list action items for any authenticated user', async () => {
      // Create some action items
      await actionItemModel.create({
        title: 'Item 1',
        status: ActionItemStatus.TODO,
        createdBy: responsableUserId,
      });
      await actionItemModel.create({
        title: 'Item 2',
        status: ActionItemStatus.IN_PROGRESS,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });

      const response = await request(app.getHttpServer())
        .get('/action-items')
        .set('Authorization', `Bearer ${consultantToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      await actionItemModel.create({
        title: 'TODO Item',
        status: ActionItemStatus.TODO,
        createdBy: responsableUserId,
      });
      await actionItemModel.create({
        title: 'Done Item',
        status: ActionItemStatus.DONE,
        createdBy: responsableUserId,
      });

      const response = await request(app.getHttpServer())
        .get('/action-items?status=TODO')
        .set('Authorization', `Bearer ${consultantToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].title).toBe('TODO Item');
    });

    it('should filter by assignedTo', async () => {
      await actionItemModel.create({
        title: 'Assigned Item',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });
      await actionItemModel.create({
        title: 'Unassigned Item',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
      });

      const response = await request(app.getHttpServer())
        .get(`/action-items?assignedTo=${consultantUserId}`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].title).toBe('Assigned Item');
    });
  });

  describe('PATCH /action-items/:id/status', () => {
    it('should allow RESPONSABLE to change any status', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Test Item',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${responsableToken}`)
        .send({ status: 'CANCELED' })
        .expect(200);

      const updated = await actionItemModel.findById(actionItem._id);
      expect(updated?.status).toBe('CANCELED');
    });

    it('should allow CHEF_PROJET to change status of own items', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Chef Item',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${chefProjetToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      const updated = await actionItemModel.findById(actionItem._id);
      expect(updated?.status).toBe('IN_PROGRESS');
    });

    it('should deny CHEF_PROJET from changing status of others items', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Responsable Item',
        status: ActionItemStatus.TODO,
        createdBy: responsableUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${chefProjetToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(403);
    });

    it('should allow CONSULTANT to change status only if assigned', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Consultant Task',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      const updated = await actionItemModel.findById(actionItem._id);
      expect(updated?.status).toBe('IN_PROGRESS');
    });

    it('should deny CONSULTANT from changing status of unassigned items', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Unassigned Task',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(403);
    });

    it('should deny CONSULTANT from setting CANCELED status', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Consultant Task',
        status: ActionItemStatus.TODO,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ status: 'CANCELED' })
        .expect(403);
    });

    it('should allow CONSULTANT to set DONE status if assigned', async () => {
      const actionItem = await actionItemModel.create({
        title: 'Consultant Task',
        status: ActionItemStatus.IN_PROGRESS,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });

      await request(app.getHttpServer())
        .patch(`/action-items/${actionItem._id}/status`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .send({ status: 'DONE' })
        .expect(200);

      const updated = await actionItemModel.findById(actionItem._id);
      expect(updated?.status).toBe('DONE');
    });
  });

  describe('POST /action-items/:id/archive', () => {
    it('should allow RESPONSABLE to archive', async () => {
      const actionItem = await actionItemModel.create({
        title: 'To Archive',
        status: ActionItemStatus.DONE,
        createdBy: chefProjetUserId,
      });

      await request(app.getHttpServer())
        .post(`/action-items/${actionItem._id}/archive`)
        .set('Authorization', `Bearer ${responsableToken}`)
        .expect(200);

      const archived = await actionItemModel.findById(actionItem._id);
      expect(archived?.isArchived).toBe(true);
    });

    it('should deny CHEF_PROJET from archiving', async () => {
      const actionItem = await actionItemModel.create({
        title: 'To Archive',
        status: ActionItemStatus.DONE,
        createdBy: chefProjetUserId,
      });

      await request(app.getHttpServer())
        .post(`/action-items/${actionItem._id}/archive`)
        .set('Authorization', `Bearer ${chefProjetToken}`)
        .expect(403);
    });

    it('should deny CONSULTANT from archiving', async () => {
      const actionItem = await actionItemModel.create({
        title: 'To Archive',
        status: ActionItemStatus.DONE,
        createdBy: chefProjetUserId,
        assignedTo: consultantUserId,
      });

      await request(app.getHttpServer())
        .post(`/action-items/${actionItem._id}/archive`)
        .set('Authorization', `Bearer ${consultantToken}`)
        .expect(403);
    });
  });
});
