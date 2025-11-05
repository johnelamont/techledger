import {
  createUser,
  createSystem,
  createAction,
} from './db/queries';

import {
  createDepartment,
  createPracticeGroup,
  createActionSequence,
  addActionToSequence,
  getActionSequenceWithActions,
  getSystemHierarchy,
} from './db/hierarchyQueries';

async function testFullHierarchy() {
  console.log('🧪 Testing Full Hierarchy...\n');

  try {
    // 1. Create base entities
    const user = await createUser({
      email: `hierarchy-test-${Date.now()}@example.com`,
      name: 'Hierarchy Test User'
    });
    console.log('✅ User created:', user.id);

    const system = await createSystem({
      user_id: user.id,
      name: 'Salesforce',
      description: 'CRM System'
    });
    console.log('✅ System created:', system.id);

    // 2. Create department
    const dept = await createDepartment({
      system_id: system.id,
      name: 'Sales Department',
      description: 'Manages sales operations',
      display_order: 1
    });
    console.log('✅ Department created:', dept.id, '-', dept.name);

    // 3. Create practice group
    const pg = await createPracticeGroup({
      department_id: dept.id,
      name: 'Lead Management',
      description: 'Creating and qualifying leads',
      display_order: 1
    });
    console.log('✅ Practice Group created:', pg.id, '-', pg.name);

    // 4. Create actions in practice group
    const action1 = await createAction({
      practice_group_id: pg.id,
      title: 'Login to Salesforce',
      description: 'Access the platform',
      display_order: 1,
      steps: [
        { step_number: 1, instruction: 'Go to salesforce.com' },
        { step_number: 2, instruction: 'Enter credentials' },
        { step_number: 3, instruction: 'Click Login' }
      ]
    });
    console.log('✅ Action 1 created:', action1.id, '-', action1.title);

    const action2 = await createAction({
      practice_group_id: pg.id,
      title: 'Navigate to Leads',
      description: 'Find the leads page',
      display_order: 2
    });
    console.log('✅ Action 2 created:', action2.id, '-', action2.title);

    const action3 = await createAction({
      practice_group_id: pg.id,
      title: 'Create New Lead',
      description: 'Add a lead to the system',
      display_order: 3
    });
    console.log('✅ Action 3 created:', action3.id, '-', action3.title);

    // 5. Create action sequence (workflow)
    const sequence = await createActionSequence({
      practice_group_id: pg.id,
      name: 'Complete Lead Creation Workflow',
      description: 'End-to-end process for creating a lead'
    });
    console.log('✅ Sequence created:', sequence.id, '-', sequence.name);

    // 6. Add actions to sequence in order
    await addActionToSequence({
      sequence_id: sequence.id,
      action_id: action1.id,
      order_number: 1,
      notes: 'Must be logged in first'
    });

    await addActionToSequence({
      sequence_id: sequence.id,
      action_id: action2.id,
      order_number: 2
    });

    await addActionToSequence({
      sequence_id: sequence.id,
      action_id: action3.id,
      order_number: 3,
      notes: 'Fill all required fields'
    });
    console.log('✅ Added 3 actions to sequence');

    // 7. Retrieve complete sequence with ordered actions
    console.log('\n📋 Workflow: "Complete Lead Creation Workflow"');
    const fullSequence = await getActionSequenceWithActions(sequence.id);
    fullSequence.actions.forEach(({ action, order_number, notes }) => {
      console.log(`   ${order_number}. ${action.title}`);
      if (notes) console.log(`      Note: ${notes}`);
    });

    // 8. Get full system hierarchy
    console.log('\n🏗️  System Hierarchy:');
    const hierarchy = await getSystemHierarchy(system.id);
    console.log(`   System: ${hierarchy.system_name}`);
    if (hierarchy.departments && hierarchy.departments[0]) {
      hierarchy.departments.forEach((d: any) => {
        if (d.id) {
          console.log(`     └── Department: ${d.name}`);
          if (d.practice_groups) {
            d.practice_groups.forEach((p: any) => {
              console.log(`         └── Practice Group: ${p.name}`);
            });
          }
        }
      });
    }

    console.log('\n🎉 All hierarchy tests passed!');
    console.log('\nYou now have:');
    console.log('  ✅ 1 System');
    console.log('  ✅ 1 Department');
    console.log('  ✅ 1 Practice Group');
    console.log('  ✅ 3 Actions');
    console.log('  ✅ 1 Action Sequence (workflow with 3 steps)');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testFullHierarchy();