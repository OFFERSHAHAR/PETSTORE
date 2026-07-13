const OpenAI = require('openai');
const config = require('../config');
const db = require('../models/db');

let openai;

function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openai;
}

const SYSTEM_PROMPT = `אתה עוזר חנות חיות חכם וידידותי של "Paws & Claws Pet Store". אתה מדבר עם לקוחות בוואטסאפ בעברית.

התפקידים שלך:
1. לחפש מוצרים (מזון, ציוד, אביזרים) לפי שם או קטגוריה
2. לספק פרטי מוצר (מחיר, מלאי, תיאור)
3. לקבל הזמנות למשלוח
4. לבדוק סטטוס הזמנה
5. לרשום לקוחות חדשים

הנחיות:
- דבר תמיד בעברית חמה וידידותית.
- שאל תמיד לשם הלקוח אם אתה לא יודע אותו.
- שאל לכתובת למשלוח לפני אישור הזמנה.
- הצג שם מוצר, מחיר (₪) ומלאי כשאתה ממליץ.
- אשר פרטי הזמנה לפני ביצוע.
- אם מוצר אזל מהמלאי, הצע חלופות.
- תשובות קצרות וממוקדות לוואטסאפ.
- קבץ מוצרים לפי קטגוריות כשאתה מציג רשימה.
- השתמש ב-₪ למחירים.
- בסוף כל שיחה, תמיד תשאל אם יש עוד משהו שהם צריכים.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products by name, category, or keyword',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (product name, category, or keyword)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product',
      description: 'Get detailed information about a specific product',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Product ID' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'List all available product categories',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'register_customer',
      description: 'Register a new customer or update their info',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Customer phone number' },
          name: { type: 'string', description: 'Customer full name' },
          address: { type: 'string', description: 'Delivery address' },
        },
        required: ['phone', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Place a new order for a customer',
      parameters: {
        type: 'object',
        properties: {
          customer_phone: { type: 'string', description: 'Customer phone number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string', description: 'Product ID' },
                name: { type: 'string', description: 'Product name' },
                quantity: { type: 'number', description: 'Quantity to order' },
                price: { type: 'number', description: 'Unit price' },
              },
              required: ['product_id', 'name', 'quantity', 'price'],
            },
          },
          delivery_address: { type: 'string', description: 'Delivery address' },
          notes: { type: 'string', description: 'Order notes' },
        },
        required: ['customer_phone', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Check the status of an order',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'Order ID' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_orders',
      description: 'Get all orders for a customer by phone number',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Customer phone number' },
        },
        required: ['phone'],
      },
    },
  },
];

async function handleToolCall(toolCall) {
  const args = JSON.parse(toolCall.function.arguments);

  switch (toolCall.function.name) {
    case 'search_products': {
      const results = db.searchProducts(args.query);
      if (results.length === 0) {
        return JSON.stringify({ success: false, message: `No products found for "${args.query}".` });
      }
      return JSON.stringify({ success: true, products: results });
    }

    case 'get_product': {
      const product = db.getProduct(args.product_id);
      if (!product) {
        return JSON.stringify({ success: false, message: 'Product not found.' });
      }
      return JSON.stringify({ success: true, product });
    }

    case 'list_categories': {
      const categories = db.listCategories();
      return JSON.stringify({ success: true, categories: categories.map(c => c.category) });
    }

    case 'register_customer': {
      const customer = db.upsertCustomer(args.phone, args.name, args.address);
      return JSON.stringify({ success: true, customer });
    }

    case 'create_order': {
      for (const item of args.items) {
        const product = db.getProduct(item.product_id);
        if (!product) {
          return JSON.stringify({ success: false, message: `Product "${item.name}" not found.` });
        }
        if (product.stock < item.quantity) {
          return JSON.stringify({ success: false, message: `Only ${product.stock} of "${product.name}" in stock.` });
        }
      }
      const order = db.createOrder(args.customer_phone, args.items, args.delivery_address, args.notes);
      return JSON.stringify({ success: true, order });
    }

    case 'get_order_status': {
      const order = db.getOrder(args.order_id);
      if (!order) {
        return JSON.stringify({ success: false, message: 'Order not found.' });
      }
      return JSON.stringify({ success: true, order });
    }

    case 'get_my_orders': {
      const orders = db.getOrdersByCustomer(args.phone);
      return JSON.stringify({ success: true, orders });
    }

    default:
      return JSON.stringify({ success: false, message: 'Unknown function.' });
  }
}

async function processMessage(phone, text) {
  const client = getClient();

  db.saveMessage(phone, 'user', text);

  const history = db.getConversationHistory(phone);

  const customer = db.getCustomer(phone);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (customer) {
    messages.push({
      role: 'system',
      content: `The customer's name is ${customer.name}. Their address is ${customer.address || 'not provided'}. Their phone is ${customer.phone}.`,
    });
  }

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }

  let response;
  let finishReason;

  while (true) {
    const completion = await client.chat.completions.create({
      model: config.openai.model,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    response = choice.message.content || '';
    finishReason = choice.finish_reason;

    if (choice.message.tool_calls) {
      messages.push(choice.message);
      for (const toolCall of choice.message.tool_calls) {
        const result = await handleToolCall(toolCall);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    } else {
      break;
    }
  }

  db.saveMessage(phone, 'assistant', response);
  return response;
}

module.exports = { processMessage };
