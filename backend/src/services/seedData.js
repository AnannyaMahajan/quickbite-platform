import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Rating } from '../models/Rating.js';
import { Complaint } from '../models/Complaint.js';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('🌱 Database already populated. Skipping initial seed execution.');
      return;
    }

    console.log('⚡ Populating QuickBite Database with realistic operational seed dataset...');

    // 1. Create Core Users
    // Demo Accounts
    const defaultPassword = 'password123';
    const defaultHashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const customerDemo = await User.create({
      name: 'Alex Johnson (Demo Customer)',
      email: 'customer@quickbite.com',
      passwordHash: defaultPassword,
      role: 'CUSTOMER',
      phone: '+1 555-0192',
      addresses: [{ label: 'Home', street: '742 Evergreen Terrace', city: 'Metropolis', zipCode: '10001', isDefault: true }]
    });

    const ownerDemo = await User.create({
      name: 'Chef Marco Rossi (Demo Owner)',
      email: 'owner@quickbite.com',
      passwordHash: defaultPassword,
      role: 'RESTAURANT_OWNER',
      phone: '+1 555-0193'
    });

    const deliveryDemo = await User.create({
      name: 'David Vance (Demo Driver)',
      email: 'delivery@quickbite.com',
      passwordHash: defaultPassword,
      role: 'DELIVERY_PARTNER',
      phone: '+1 555-0194',
      isAvailable: true,
      isApproved: true,
      rating: 4.9
    });

    const adminDemo = await User.create({
      name: 'Sarah Connor (System Admin)',
      email: 'admin@quickbite.com',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      phone: '+1 555-0195'
    });

    // Generate 100 Customers
    const customerDocs = [customerDemo];
    for (let i = 1; i <= 100; i++) {
      customerDocs.push({
        name: `Customer User ${i}`,
        email: `customer${i}@quickbite.com`,
        passwordHash: defaultHashedPassword,
        role: 'CUSTOMER',
        phone: `+1 555-10${i.toString().padStart(2, '0')}`,
        addresses: [{ label: 'Home', street: `${100 + i} Main Street`, city: 'Metropolis', zipCode: '10001', isDefault: true }]
      });
    }
    const createdCustomers = await User.insertMany(customerDocs.slice(1));
    const allCustomers = [customerDemo, ...createdCustomers];

    // Generate 30 Delivery Partners
    const deliveryPartnerDocs = [deliveryDemo];
    for (let i = 1; i <= 30; i++) {
      deliveryPartnerDocs.push({
        name: `Delivery Rider ${i}`,
        email: `driver${i}@quickbite.com`,
        passwordHash: defaultHashedPassword,
        role: 'DELIVERY_PARTNER',
        phone: `+1 555-20${i.toString().padStart(2, '0')}`,
        isAvailable: i % 5 !== 0,
        isApproved: true,
        rating: +(4.2 + (i % 8) * 0.1).toFixed(1),
        totalDeliveriesCompleted: 50 + i * 8
      });
    }
    const createdDrivers = await User.insertMany(deliveryPartnerDocs.slice(1));
    const allDrivers = [deliveryDemo, ...createdDrivers];

    // Generate 25+ Restaurants
    const restaurantNames = [
      { name: 'Trattoria Bella', cuisine: ['Italian', 'Pasta', 'Pizza'], img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tokyo Sushi & Ramen House', cuisine: ['Japanese', 'Sushi', 'Ramen'], img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Spice Craft Indian Kitchen', cuisine: ['Indian', 'Curry', 'Biryani'], img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
      { name: 'El Mariachi Taqueria', cuisine: ['Mexican', 'Tacos', 'Burritos'], img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80' },
      { name: 'The Artisan Burger Co.', cuisine: ['American', 'Burgers', 'Fries'], img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dragon Palace Chinese Dim Sum', cuisine: ['Chinese', 'Dim Sum', 'Noodles'], img: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80' },
      { name: 'Green Garden Vegan Bistro', cuisine: ['Vegan', 'Healthy', 'Salads'], img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
      { name: 'Bangkok Street Eats', cuisine: ['Thai', 'Curry', 'Street Food'], img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80' },
      { name: 'The Mediterranean Olive', cuisine: ['Mediterranean', 'Greek', 'Kebab'], img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
      { name: 'Le Petit Bakery & Cafe', cuisine: ['Bakery', 'Desserts', 'Coffee'], img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
      { name: 'Seoul BBQ House', cuisine: ['Korean', 'BBQ', 'Bibimbap'], img: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pharaoh & Falafel', cuisine: ['Middle Eastern', 'Falafel', 'Hummus'], img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80' },
      { name: 'Texas Smokehouse Barbecue', cuisine: ['American', 'BBQ', 'Ribs'], img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80' },
      { name: 'Bombay Biryani House', cuisine: ['Indian', 'Biryani', 'Mughlai'], img: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pizzeria Napoli', cuisine: ['Italian', 'Woodfired Pizza'], img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
      { name: 'Saigon Pho Kitchen', cuisine: ['Vietnamese', 'Pho', 'Banh Mi'], img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80' },
      { name: 'Urban Poké & Bowls', cuisine: ['Hawaiian', 'Healthy', 'Poké'], img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
      { name: 'The Daily Brew & Brunch', cuisine: ['Breakfast', 'Pancakes', 'Coffee'], img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80' },
      { name: 'Coastal Catch Seafood Grill', cuisine: ['Seafood', 'Grill', 'Fish'], img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tapas & Sangria Bar', cuisine: ['Spanish', 'Tapas', 'Small Plates'], img: 'https://images.unsplash.com/photo-1515443961218-a5136d888be7?auto=format&fit=crop&w=600&q=80' },
      { name: 'Wok & Roll Street Asian', cuisine: ['Asian Fusion', 'Noodles'], img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80' },
      { name: 'Cajun Creole Shack', cuisine: ['Cajun', 'Southern', 'Gumbo'], img: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweet Tooth Artisan Desserts', cuisine: ['Desserts', 'Ice Cream', 'Cakes'], img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
      { name: 'Kebab Empire', cuisine: ['Turkish', 'Kebabs', 'Grill'], img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80' },
      { name: 'Fresh & Pressed Juice Bar', cuisine: ['Smoothies', 'Healthy', 'Juices'], img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7?auto=format&fit=crop&w=600&q=80' },
      { name: 'The Steakhouse Prime', cuisine: ['Steak', 'American', 'Fine Dining'], img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' }
    ];

    const restaurantDocs = [];
    for (let i = 0; i < restaurantNames.length; i++) {
      const rest = restaurantNames[i];
      restaurantDocs.push({
        ownerId: i === 0 ? ownerDemo._id : (await User.create({
          name: `Owner of ${rest.name}`,
          email: `owner${i + 1}@quickbite.com`,
          passwordHash: defaultPassword,
          role: 'RESTAURANT_OWNER',
          phone: `+1 555-30${i.toString().padStart(2, '0')}`
        }))._id,
        name: rest.name,
        description: `Authentic ${rest.cuisine.join(', ')} prepared with fresh ingredients daily.`,
        cuisines: rest.cuisine,
        address: { street: `${200 + i * 15} Gourmet Ave`, city: 'Metropolis', zipCode: '10001' },
        rating: +(4.2 + (i % 7) * 0.1).toFixed(1),
        totalRatings: 45 + i * 12,
        image: rest.img,
        status: i === 3 ? 'TEMPORARILY_UNAVAILABLE' : (i % 6 === 0 ? 'CLOSED' : 'OPEN'),
        isApproved: true,
        costForTwo: 350 + (i % 5) * 150
      });
    }

    const createdRestaurants = await Restaurant.insertMany(restaurantDocs);

    // Generate Menu Categories & 100+ Menu Items
    const sampleDishes = [
      { name: 'Classic Margherita Pizza', price: 299, isVeg: true },
      { name: 'Truffle & Mushroom Pasta', price: 349, isVeg: true },
      { name: 'Pepperoni Supreme Pizza', price: 399, isVeg: false },
      { name: 'Tonkotsu Pork Ramen', price: 429, isVeg: false },
      { name: 'Salmon Nigiri (6 pcs)', price: 499, isVeg: false },
      { name: 'Chicken Dumplings (8 pcs)', price: 259, isVeg: false },
      { name: 'Butter Chicken Special', price: 389, isVeg: false },
      { name: 'Paneer Tikka Masala', price: 329, isVeg: true },
      { name: 'Hyderabadi Chicken Biryani', price: 349, isVeg: false },
      { name: 'Garlic Butter Naan (2 pcs)', price: 79, isVeg: true },
      { name: 'Smokey Bacon Cheeseburger', price: 299, isVeg: false },
      { name: 'Crispy Truffle Fries', price: 179, isVeg: true },
      { name: 'Street Tacos Trio', price: 279, isVeg: false },
      { name: 'Loaded Guacamole & Chips', price: 199, isVeg: true },
      { name: 'Green Goddess Avocado Bowl', price: 319, isVeg: true },
      { name: 'Pad Thai Noodles', price: 329, isVeg: false },
      { name: 'Matcha Green Tea Gelato', price: 149, isVeg: true },
      { name: 'Chocolate Lava Cake', price: 189, isVeg: true }
    ];

    const allMenuItems = [];

    for (const rest of createdRestaurants) {
      const cat1 = await MenuCategory.create({ restaurantId: rest._id, name: 'Chef Specials', displayOrder: 1 });
      const cat2 = await MenuCategory.create({ restaurantId: rest._id, name: 'Main Course', displayOrder: 2 });
      const cat3 = await MenuCategory.create({ restaurantId: rest._id, name: 'Sides & Desserts', displayOrder: 3 });

      for (let j = 0; j < 5; j++) {
        const dish = sampleDishes[(rest._id.toString().charCodeAt(5) + j) % sampleDishes.length];
        allMenuItems.push({
          restaurantId: rest._id,
          categoryId: j < 2 ? cat1._id : (j < 4 ? cat2._id : cat3._id),
          name: `${dish.name} - ${rest.name.split(' ')[0]} Style`,
          description: `Signature item made with fresh local ingredients.`,
          price: dish.price,
          isVeg: dish.isVeg,
          isAvailable: j !== 4, // 1 out of 5 items marked out of stock for testing
          quantity: j === 4 ? 0 : (j === 0 ? 1 : 45), // Stock = 1 for Test 3 concurrency testing!
          image: rest.image
        });
      }
    }

    const createdMenuItems = await MenuItem.insertMany(allMenuItems);
    console.log(`✅ Created ${createdRestaurants.length} Restaurants & ${createdMenuItems.length} Menu Items.`);

    // Generate Hundreds of Historical & Active Orders
    const orderStatuses = [
      'DELIVERED', 'COMPLETED', 'DELIVERED', 'COMPLETED', 
      'PLACED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'
    ];

    const ordersToInsert = [];
    for (let i = 1; i <= 120; i++) {
      const customer = allCustomers[i % allCustomers.length];
      const restaurant = createdRestaurants[i % createdRestaurants.length];
      const driver = allDrivers[i % allDrivers.length];
      const restMenuItems = createdMenuItems.filter(m => m.restaurantId.toString() === restaurant._id.toString());
      const selectedItem = restMenuItems[0] || createdMenuItems[0];

      const status = orderStatuses[i % orderStatuses.length];
      const qty = (i % 3) + 1;
      const totalAmount = selectedItem.price * qty;
      const grandTotal = totalAmount + 40 + 20;

      ordersToInsert.push({
        orderNumber: `QB-${100000 + i}`,
        customerId: customer._id,
        restaurantId: restaurant._id,
        items: [{
          menuItemId: selectedItem._id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: qty,
          subtotal: totalAmount
        }],
        totalAmount,
        deliveryFee: 40,
        tax: 20,
        grandTotal,
        deliveryAddress: customer.addresses[0] || { street: '100 Main St', city: 'Metropolis', zipCode: '10001' },
        status,
        assignedDeliveryPartnerId: ['PLACED', 'CANCELLED'].includes(status) ? null : driver._id,
        placedAt: new Date(Date.now() - (120 - i) * 3600 * 1000 * 2), // Spread across past days
        isFlaggedForFraud: i % 25 === 0 // Fraud flag indicator on some orders
      });
    }

    const createdOrders = await Order.insertMany(ordersToInsert);

    // Create Order Timeline Audit Entries & Ratings
    const ratingsToInsert = [];
    const complaintsToInsert = [];

    for (let i = 0; i < createdOrders.length; i++) {
      const order = createdOrders[i];
      await OrderStatusHistory.create({
        orderId: order._id,
        status: order.status,
        timestamp: order.placedAt,
        note: `Order status set to ${order.status}`
      });

      if (['DELIVERED', 'COMPLETED'].includes(order.status) && i % 3 === 0) {
        ratingsToInsert.push({
          orderId: order._id,
          customerId: order.customerId,
          restaurantId: order.restaurantId,
          deliveryPartnerId: order.assignedDeliveryPartnerId,
          restaurantRating: 4 + (i % 2),
          restaurantReview: 'Delicious food, hot and well packed!',
          deliveryRating: 5,
          deliveryReview: 'Super fast delivery!'
        });
      }

      if (i % 20 === 0) {
        complaintsToInsert.push({
          ticketNumber: `TICKET-${5000 + i}`,
          orderId: order._id,
          customerId: order.customerId,
          restaurantId: order.restaurantId,
          subject: 'Late Delivery / Cold Food',
          description: 'The order took longer than estimated and food was lukewarm.',
          category: 'LATE_DELIVERY',
          status: i % 40 === 0 ? 'RESOLVED' : 'OPEN',
          resolutionNotes: i % 40 === 0 ? 'Refund of $10 issued to customer wallet.' : ''
        });
      }
    }

    if (ratingsToInsert.length > 0) await Rating.insertMany(ratingsToInsert);
    if (complaintsToInsert.length > 0) await Complaint.insertMany(complaintsToInsert);

    console.log(`✨ QuickBite Seed Completed Successfully: ${createdOrders.length} Orders, ${ratingsToInsert.length} Ratings, ${complaintsToInsert.length} Complaints created!`);

  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
  }
};
