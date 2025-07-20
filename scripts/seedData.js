const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const LaborRequest = require('../models/LaborRequest');
const Notification = require('../models/Notification');

const connectDB = require('../config/database');

// Sample data
const locations = ['Kukatpally', 'Bachupally', 'Madhapur', 'Kondapur', 'Financial District', 'Nanakramguda', 'Manikonda'];
const categories = ['mason', 'helper', 'carpenter', 'plumber', 'painter', 'electrician'];

const workerNames = [
  'Ravi Kumar', 'Suresh Reddy', 'Mahesh Babu', 'Venkat Rao', 'Srinivas Goud',
  'Ramesh Naidu', 'Krishna Murthy', 'Prakash Singh', 'Rajesh Kumar', 'Mohan Das',
  'Anil Kumar', 'Vikram Singh', 'Naresh Reddy', 'Ganesh Rao', 'Santosh Kumar',
  'Murali Krishna', 'Kiran Kumar', 'Praveen Singh', 'Rakesh Reddy', 'Sanjay Das',
  'Naveen Kumar'
];

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await LaborRequest.deleteMany({});
    await Notification.deleteMany({});

    // Create admin user
    console.log('👑 Creating admin user...');
    const admin = new User({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@laborplatform.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'admin',
      phone: '+91-9999999999',
      isApproved: true
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create sample builders
    console.log('🏗️ Creating sample builders...');
    const builders = [];
    for (let i = 1; i <= 3; i++) {
      const builder = new User({
        name: `Builder ${i}`,
        email: `builder${i}@example.com`,
        password: 'password123',
        role: 'builder',
        phone: `+91-98765432${i}0`,
        companyName: `Construction Company ${i}`,
        isApproved: true
      });
      await builder.save();
      builders.push(builder);
    }
    console.log(`✅ Created ${builders.length} builders`);

    // Create sample supervisors
    console.log('👷‍♂️ Creating sample supervisors...');
    const supervisors = [];
    for (let i = 0; i < locations.length; i++) {
      const supervisor = new User({
        name: `Supervisor ${locations[i]}`,
        email: `supervisor${i + 1}@example.com`,
        password: 'password123',
        role: 'supervisor',
        phone: `+91-87654321${i}0`,
        location: locations[i],
        isApproved: true
      });
      await supervisor.save();
      supervisors.push(supervisor);
    }
    console.log(`✅ Created ${supervisors.length} supervisors`);

    // Create workers (5 per location, 21 per category)
    console.log('👷 Creating workers...');
    const workers = [];
    let nameIndex = 0;

    for (const location of locations) {
      for (const category of categories) {
        // Create 5 workers per location per category
        for (let i = 0; i < 5; i++) {
          if (nameIndex >= workerNames.length) nameIndex = 0;
          
          const worker = new User({
            name: workerNames[nameIndex],
            email: `worker_${location.toLowerCase()}_${category}_${i + 1}@example.com`,
            password: 'password123',
            role: 'worker',
            phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            location: location,
            category: category,
            experience: Math.floor(Math.random() * 15) + 1, // 1-15 years
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
            isApproved: true,
            isAvailable: Math.random() > 0.3 // 70% are available
          });
          await worker.save();
          workers.push(worker);
          nameIndex++;
        }
      }
    }
    console.log(`✅ Created ${workers.length} workers`);

    // Create sample labor requests
    console.log('📋 Creating sample labor requests...');
    const wageRates = {
      mason: 1200,
      helper: 800,
      carpenter: 1000,
      plumber: 1000,
      painter: 900,
      electrician: 1000
    };

    const sampleProjects = [
      {
        description: 'Residential construction project',
        workAddress: 'Plot 123, Gachibowli, Hyderabad'
      },
      {
        description: 'Commercial building renovation',
        workAddress: 'Cyber City, Madhapur, Hyderabad'
      },
      {
        description: 'Villa construction',
        workAddress: 'Serlingampally, Hyderabad'
      },
      {
        description: 'Office interior work',
        workAddress: 'Financial District, Hyderabad'
      },
      {
        description: 'Home renovation project',
        workAddress: 'Kukatpally, Hyderabad'
      }
    ];

    const requests = [];
    for (let i = 0; i < 10; i++) {
      const builder = builders[Math.floor(Math.random() * builders.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const numberOfWorkers = Math.floor(Math.random() * 5) + 1; // 1-5 workers
      const numberOfDays = Math.floor(Math.random() * 20) + 5; // 5-25 days
      const project = sampleProjects[Math.floor(Math.random() * sampleProjects.length)];
      const isEmergency = Math.random() > 0.8; // 20% emergency requests

      const request = new LaborRequest({
        builder: builder._id,
        location: location,
        category: category,
        numberOfWorkers: numberOfWorkers,
        numberOfDays: numberOfDays,
        wagePerDay: wageRates[category],
        withSupervisor: Math.random() > 0.5,
        isEmergency: isEmergency,
        description: project.description,
        workAddress: project.workAddress,
        contactPerson: {
          name: builder.name,
          phone: builder.phone
        },
        status: ['pending', 'approved', 'in-progress', 'completed'][Math.floor(Math.random() * 4)]
      });

      // If approved or in-progress, assign some workers
      if (request.status === 'approved' || request.status === 'in-progress' || request.status === 'completed') {
        const availableWorkers = workers.filter(w => 
          w.location === location && 
          w.category === category && 
          w.isAvailable
        );

        const workersToAssign = Math.min(numberOfWorkers, availableWorkers.length);
        for (let j = 0; j < workersToAssign; j++) {
          request.assignedWorkers.push({
            worker: availableWorkers[j]._id,
            assignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date in last 7 days
          });

          // Update worker availability
          if (request.status === 'in-progress') {
            availableWorkers[j].isAvailable = false;
            availableWorkers[j].currentProject = request._id;
            await availableWorkers[j].save();
          }
        }

        if (request.status === 'in-progress') {
          request.startDate = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);
        } else if (request.status === 'completed') {
          request.startDate = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
          request.endDate = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);
          request.paymentStatus = 'completed';

          // Add worker ratings
          request.assignedWorkers.forEach(assigned => {
            request.workerRatings.push({
              worker: assigned.worker,
              rating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
              feedback: 'Good work performance'
            });
          });
        }
      }

      await request.save();
      requests.push(request);
    }
    console.log(`✅ Created ${requests.length} labor requests`);

    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const notificationTypes = [
      {
        type: 'labor_request_created',
        title: 'New Labor Request',
        message: 'A new labor request has been submitted and needs approval.'
      },
      {
        type: 'worker_assigned',
        title: 'Worker Assigned',
        message: 'A worker has been assigned to your project.'
      },
      {
        type: 'work_completed',
        title: 'Work Completed',
        message: 'A project has been marked as completed.'
      }
    ];

    for (let i = 0; i < 5; i++) {
      const notif = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const notification = new Notification({
        recipient: admin._id,
        sender: builders[Math.floor(Math.random() * builders.length)]._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: Math.random() > 0.5,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
      await notification.save();
    }
    console.log('✅ Created sample notifications');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`👑 Admin: 1`);
    console.log(`🏗️ Builders: ${builders.length}`);
    console.log(`👷‍♂️ Supervisors: ${supervisors.length}`);
    console.log(`👷 Workers: ${workers.length}`);
    console.log(`📋 Labor Requests: ${requests.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
    console.log(`Builder: builder1@example.com / password123`);
    console.log(`Worker: ${workers[0].email} / password123`);

    console.log('\n🌍 Locations covered:');
    locations.forEach(location => {
      const workersInLocation = workers.filter(w => w.location === location).length;
      console.log(`📍 ${location}: ${workersInLocation} workers`);
    });

    console.log('\n👥 Worker categories:');
    categories.forEach(category => {
      const workersInCategory = workers.filter(w => w.category === category).length;
      console.log(`🔧 ${category}: ${workersInCategory} workers`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed script
if (require.main === module) {
  seedData();
}

module.exports = seedData;