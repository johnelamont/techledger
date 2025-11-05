import { 
  createUser, 
  createSystem, 
  createAction,
  getActionsBySystemId 
} from './db';

async function quickDemo() {
  try {
    // 1. Create a user
    console.log('Creating user...');
    const user = await createUser({
      email: 'demo@techledger.com',
      name: 'Demo User'
    });
    console.log('✅ User created:', user.id);

    // 2. Create a system for that user
    console.log('\nCreating system...');
    const system = await createSystem({
      user_id: user.id,
      name: 'Salesforce',
      description: 'Our CRM system'
    });
    console.log('✅ System created:', system.id);

    // 3. Create an action with steps
    console.log('\nCreating action...');
    const action = await createAction({
      system_id: system.id,
      title: 'Create New Lead',
      description: 'How to create a lead in Salesforce',
      steps: [
        { step_number: 1, instruction: 'Click the "New" button' },
        { step_number: 2, instruction: 'Select "Lead" from dropdown' },
        { step_number: 3, instruction: 'Fill in lead information' },
        { step_number: 4, instruction: 'Click "Save"' }
      ]
    });
    console.log('✅ Action created:', action.id);
    console.log('   Steps:', action.steps?.length);

    // 4. List all actions for this system
    console.log('\nListing actions...');
    const actions = await getActionsBySystemId(system.id);
    console.log('✅ Found actions:', actions.data.length);
    actions.data.forEach(a => {
      console.log(`   - ${a.title} (${a.steps?.length || 0} steps)`);
    });

    console.log('\n🎉 Demo complete! Check your database.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickDemo();