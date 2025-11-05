/**
 * TechLedger Database Test Script
 * 
 * Run this to verify your database layer is working correctly
 * Usage: ts-node src/tests/testDatabase.ts
 * 
 * EXPLANATION FOR NODE.JS NEWCOMERS:
 * - This file tests all CRUD operations
 * - Run it after setting up your database
 * - If all tests pass, your database layer is ready!
 */

import {
  // User operations
  createUser,
  getUserById,
  getUserByEmail,
  getUsers,
  updateUser,
  deleteUser,
  
  // System operations
  createSystem,
  getSystemById,
  getSystemsByUserId,
  updateSystem,
  deleteSystem,
  
  // Action operations
  createAction,
  getActionById,
  getActionsBySystemId,
  updateAction,
  deleteAction,
  
  // Screenshot operations
  createScreenshot,
  getScreenshotById,
  getScreenshotsByActionId,
  updateScreenshot,
  deleteScreenshot,
  
  // Utilities
  userOwnsSystem,
  getActionWithSystem,
} from '../db/queries';

import {
  validateCreateUser,
  validateUpdateUser,
  validateCreateSystem,
  validateCreateAction,
  validateCreateScreenshot,
} from '../utils/validation';

// Test tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

async function runTest(name: string, testFn: () => Promise<void>) {
  testsRun++;
  try {
    await testFn();
    testsPassed++;
    log(`✓ ${name}`, 'success');
  } catch (error: any) {
    testsFailed++;
    log(`✗ ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
  }
}

async function main() {
  log('\n=== TechLedger Database Tests ===\n', 'info');

  let testUser: any;
  let testSystem: any;
  let testAction: any;
  let testScreenshot: any;

  // ============================================================================
  // USER TESTS
  // ============================================================================

  log('\n--- User Tests ---', 'info');

  await runTest('Create User', async () => {
    const input = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };
    validateCreateUser(input);
    testUser = await createUser(input);
    
    if (!testUser.id) throw new Error('User ID not returned');
    if (testUser.email !== input.email) throw new Error('Email mismatch');
  });

  await runTest('Get User by ID', async () => {
    const user = await getUserById(testUser.id);
    if (user.id !== testUser.id) throw new Error('User ID mismatch');
  });

  await runTest('Get User by Email', async () => {
    const user = await getUserByEmail(testUser.email);
    if (!user) throw new Error('User not found');
    if (user.id !== testUser.id) throw new Error('User ID mismatch');
  });

  await runTest('Get Users (Pagination)', async () => {
    const result = await getUsers({ limit: 10, offset: 0 });
    if (!Array.isArray(result.data)) throw new Error('Data is not an array');
    if (typeof result.total !== 'number') throw new Error('Total is not a number');
  });

  await runTest('Update User', async () => {
    const updateData = { name: 'Updated Test User' };
    validateUpdateUser(updateData);
    const updated = await updateUser(testUser.id, updateData);
    if (updated.name !== updateData.name) throw new Error('Name not updated');
  });

  // ============================================================================
  // SYSTEM TESTS
  // ============================================================================

  log('\n--- System Tests ---', 'info');

  await runTest('Create System', async () => {
    const input = {
      user_id: testUser.id,
      name: 'Test System',
      description: 'A test business system',
    };
    validateCreateSystem(input);
    testSystem = await createSystem(input);
    
    if (!testSystem.id) throw new Error('System ID not returned');
    if (testSystem.name !== input.name) throw new Error('Name mismatch');
  });

  await runTest('Get System by ID', async () => {
    const system = await getSystemById(testSystem.id);
    if (system.id !== testSystem.id) throw new Error('System ID mismatch');
  });

  await runTest('Get Systems by User ID', async () => {
    const result = await getSystemsByUserId(testUser.id);
    if (!Array.isArray(result.data)) throw new Error('Data is not an array');
    if (result.data.length === 0) throw new Error('No systems found');
  });

  await runTest('Update System', async () => {
    const updateData = { description: 'Updated description' };
    const updated = await updateSystem(testSystem.id, updateData);
    if (updated.description !== updateData.description) {
      throw new Error('Description not updated');
    }
  });

  await runTest('Check User Owns System', async () => {
    const owns = await userOwnsSystem(testUser.id, testSystem.id);
    if (!owns) throw new Error('Ownership check failed');
  });

  // ============================================================================
  // ACTION TESTS
  // ============================================================================

  log('\n--- Action Tests ---', 'info');

  await runTest('Create Action', async () => {
    const input = {
      system_id: testSystem.id,
      title: 'Test Action',
      description: 'A test action',
      steps: [
        {
          step_number: 1,
          instruction: 'Do something',
          notes: 'Important note',
        },
        {
          step_number: 2,
          instruction: 'Do something else',
        },
      ],
    };
    validateCreateAction(input);
    testAction = await createAction(input);
    
    if (!testAction.id) throw new Error('Action ID not returned');
    if (!testAction.steps) throw new Error('Steps not saved');
    if (testAction.steps.length !== 2) throw new Error('Wrong number of steps');
  });

  await runTest('Get Action by ID', async () => {
    const action = await getActionById(testAction.id);
    if (action.id !== testAction.id) throw new Error('Action ID mismatch');
    if (!action.steps) throw new Error('Steps not loaded');
  });

  await runTest('Get Actions by System ID', async () => {
    const result = await getActionsBySystemId(testSystem.id);
    if (!Array.isArray(result.data)) throw new Error('Data is not an array');
    if (result.data.length === 0) throw new Error('No actions found');
  });

  await runTest('Update Action', async () => {
    const updateData = {
      title: 'Updated Action Title',
      steps: [
        {
          step_number: 1,
          instruction: 'Updated step',
        },
      ],
    };
    const updated = await updateAction(testAction.id, updateData);
    if (updated.title !== updateData.title) throw new Error('Title not updated');
    if (!updated.steps || updated.steps.length !== 1) {
      throw new Error('Steps not updated correctly');
    }
  });

  await runTest('Get Action with System (JOIN)', async () => {
    const action = await getActionWithSystem(testAction.id);
    if (!action.system) throw new Error('System not joined');
    if (action.system.id !== testSystem.id) throw new Error('Wrong system joined');
  });

  // ============================================================================
  // SCREENSHOT TESTS
  // ============================================================================

  log('\n--- Screenshot Tests ---', 'info');

  await runTest('Create Screenshot', async () => {
    const input = {
      action_id: testAction.id,
      file_path: '/uploads/test-screenshot.png',
      original_filename: 'test-screenshot.png',
      ocr_data: {
        full_text: 'Sample OCR text',
        words: [
          { text: 'Sample', confidence: 0.99 },
          { text: 'OCR', confidence: 0.98 },
        ],
        detected_at: new Date().toISOString(),
      },
    };
    validateCreateScreenshot(input);
    testScreenshot = await createScreenshot(input);
    
    if (!testScreenshot.id) throw new Error('Screenshot ID not returned');
    if (!testScreenshot.ocr_data) throw new Error('OCR data not saved');
  });

  await runTest('Get Screenshot by ID', async () => {
    const screenshot = await getScreenshotById(testScreenshot.id);
    if (screenshot.id !== testScreenshot.id) {
      throw new Error('Screenshot ID mismatch');
    }
    if (!screenshot.ocr_data) throw new Error('OCR data not loaded');
  });

  await runTest('Get Screenshots by Action ID', async () => {
    const result = await getScreenshotsByActionId(testAction.id);
    if (!Array.isArray(result.data)) throw new Error('Data is not an array');
    if (result.data.length === 0) throw new Error('No screenshots found');
  });

  await runTest('Update Screenshot (Add Vision Data)', async () => {
    const updateData = {
      vision_data: {
        labels: [
          { description: 'Screenshot', score: 0.95 },
        ],
        processed_at: new Date().toISOString(),
      },
    };
    const updated = await updateScreenshot(testScreenshot.id, updateData);
    if (!updated.vision_data) throw new Error('Vision data not updated');
  });

  // ============================================================================
  // CLEANUP & DELETE TESTS
  // ============================================================================

  log('\n--- Cleanup Tests ---', 'info');

  await runTest('Delete Screenshot', async () => {
    const deleted = await deleteScreenshot(testScreenshot.id);
    if (!deleted) throw new Error('Screenshot not deleted');
  });

  await runTest('Delete Action', async () => {
    const deleted = await deleteAction(testAction.id);
    if (!deleted) throw new Error('Action not deleted');
  });

  await runTest('Delete System', async () => {
    const deleted = await deleteSystem(testSystem.id);
    if (!deleted) throw new Error('System not deleted');
  });

  await runTest('Delete User', async () => {
    const deleted = await deleteUser(testUser.id);
    if (!deleted) throw new Error('User not deleted');
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  log('\n--- Error Handling Tests ---', 'info');

  await runTest('Get Non-existent User', async () => {
    try {
      await getUserById(999999);
      throw new Error('Should have thrown NotFoundError');
    } catch (error: any) {
      if (!error.message.includes('not found')) {
        throw new Error('Wrong error type');
      }
    }
  });

  await runTest('Create User with Duplicate Email', async () => {
    try {
      const email = `duplicate-${Date.now()}@example.com`;
      await createUser({ email, name: 'User 1' });
      await createUser({ email, name: 'User 2' });
      throw new Error('Should have thrown ConflictError');
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw new Error('Wrong error type');
      }
      // Success - error was caught
    }
  });

  // ============================================================================
  // RESULTS
  // ============================================================================

  log('\n=== Test Results ===', 'info');
  log(`Total Tests: ${testsRun}`, 'info');
  log(`Passed: ${testsPassed}`, 'success');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  
  if (testsFailed === 0) {
    log('\n🎉 All tests passed! Your database layer is working perfectly!', 'success');
  } else {
    log('\n❌ Some tests failed. Check the errors above.', 'error');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
