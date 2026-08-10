import { MenuItem } from '../models/MenuItem.js';
import { emitSocketEvent } from './socketService.js';

export const reserveInventoryAtomic = async (items) => {
  const reservedItems = [];

  try {
    for (const item of items) {
      // ATOMIC MONGODB QUERY & UPDATE:
      // Condition: _id matches AND isAvailable is true AND quantity is >= requested quantity
      // Update: decrement quantity by requested quantity
      const updatedItem = await MenuItem.findOneAndUpdate(
        {
          _id: item.menuItemId,
          isAvailable: true,
          quantity: { $gte: item.quantity } // Prevents quantity from dropping below 0 under concurrent load
        },
        {
          $inc: { quantity: -item.quantity }
        },
        { new: true }
      );

      if (!updatedItem) {
        // Rollback all previously reserved items in this order
        for (const reserved of reservedItems) {
          await MenuItem.findByIdAndUpdate(reserved.menuItemId, {
            $inc: { quantity: reserved.quantity },
            isAvailable: true
          });
        }

        const currentItem = await MenuItem.findById(item.menuItemId);
        const itemName = currentItem ? currentItem.name : 'Selected Item';
        throw {
          statusCode: 409, // Conflict / Concurrency failure
          message: `Item '${itemName}' is no longer available in the requested quantity (Requested: ${item.quantity}). Stock depleted by concurrent orders.`
        };
      }

      reservedItems.push(item);

      // Real-time notification if item reaches 0 stock
      if (updatedItem.quantity === 0) {
        await MenuItem.findByIdAndUpdate(updatedItem._id, { isAvailable: false });
        emitSocketEvent('menu:availability_changed', {
          itemId: updatedItem._id,
          restaurantId: updatedItem.restaurantId,
          isAvailable: false,
          quantity: 0
        }, [`restaurant:${updatedItem.restaurantId}`, 'role:customer']);
      }
    }

    return reservedItems;
  } catch (error) {
    throw error;
  }
};

export const restoreInventory = async (items) => {
  for (const item of items) {
    await MenuItem.findByIdAndUpdate(item.menuItemId, {
      $inc: { quantity: item.quantity },
      isAvailable: true
    });
  }
};
