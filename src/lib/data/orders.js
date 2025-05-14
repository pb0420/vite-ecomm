
export const sampleOrders = [
  {
    id: "ORD-001",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      address: "123 Main St, Anytown, USA"
    },
    items: [
      { id: 1, name: "Organic Bananas", price: 1.99, quantity: 2 },
      { id: 4, name: "Large Eggs", price: 4.49, quantity: 1 }
    ],
    total: 8.47,
    status: "delivered",
    date: "2025-05-01T10:30:00",
    deliveryNotes: "Leave at the front door"
  },
  {
    id: "ORD-002",
    customer: {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "555-987-6543",
      address: "456 Oak Ave, Somewhere, USA"
    },
    items: [
      { id: 8, name: "Atlantic Salmon", price: 12.99, quantity: 1 },
      { id: 5, name: "Sourdough Bread", price: 5.99, quantity: 1 },
      { id: 11, name: "Orange Juice", price: 4.99, quantity: 2 }
    ],
    total: 28.96,
    status: "processing",
    date: "2025-05-02T09:15:00",
    deliveryNotes: "Call upon arrival"
  },
  {
    id: "ORD-003",
    customer: {
      name: "Robert Johnson",
      email: "robert@example.com",
      phone: "555-456-7890",
      address: "789 Pine St, Nowhere, USA"
    },
    items: [
      { id: 2, name: "Avocado", price: 2.49, quantity: 3 },
      { id: 6, name: "Chocolate Croissants", price: 6.99, quantity: 1 },
      { id: 3, name: "Whole Milk", price: 3.99, quantity: 1 }
    ],
    total: 18.45,
    status: "pending",
    date: "2025-05-02T14:45:00",
    deliveryNotes: ""
  }
];
  