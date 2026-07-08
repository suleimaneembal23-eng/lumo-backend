const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateItemsListHtml = (order) => {
  let itemsHtml = '';
  order.shopOrders.forEach(shop => {
    shop.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <p style="margin: 0; font-weight: bold; color: #333;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
              Qtd: ${item.quantity} | Tam: ${item.size || 'Único'} | Loja: ${shop.shopName || 'Lumo'}
            </p>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333;">
            ${item.price} FCFA
          </td>
        </tr>
      `;
    });
  });
  return itemsHtml;
};

exports.sendOrderConfirmation = async (user, order) => {
  try {
    const mailOptions = {
      from: `"Lumo" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎉 A tua encomenda #${order._id.toString().slice(-6).toUpperCase()} está confirmada!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Obrigado, ${user.name.split(' ')[0]}!</h1>
            <p style="color: #bfdbfe; margin-top: 10px; font-size: 16px;">Recebemos a tua encomenda com sucesso.</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              A tua compra está a ser processada pela nossa equipa. Abaixo podes encontrar os detalhes do que acabaste de encomendar:
            </p>
            
            <!-- Detalhes Encomenda -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 25px;">
              <h3 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Resumo (Pedido #${order._id.toString().slice(-6).toUpperCase()})</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                ${generateItemsListHtml(order)}
              </table>
              
              <div style="margin-top: 20px; text-align: right;">
                <p style="color: #64748b; margin: 5px 0;">Subtotal Itens: ${order.itemsPrice} FCFA</p>
                <p style="color: #64748b; margin: 5px 0;">Taxa de Entrega: ${order.shippingPrice > 0 ? order.shippingPrice + ' FCFA' : 'Grátis'}</p>
                <h2 style="color: #0f172a; margin: 15px 0 0 0; font-size: 24px;">Total: ${order.totalPrice} FCFA</h2>
              </div>
            </div>
            
            <!-- Address se existir -->
            ${order.shippingAddress?.line1 ? `
            <div style="margin-top: 30px;">
              <h4 style="color: #1e293b; margin-bottom: 8px;">📍 Morada de Entrega:</h4>
              <p style="color: #4b5563; margin: 0; line-height: 1.5; font-size: 14px;">
                ${order.shippingAddress.line1}<br>
                ${order.shippingAddress.city ? order.shippingAddress.city + '<br>' : ''}
                ${order.shippingAddress.country || ''}
              </p>
            </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
              <a href="http://localhost:3000/track-order" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Rastrear Encomenda
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">
                Usa este código secreto no site para rastreares: <strong>${order._id}</strong>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Lumo. Todos os direitos reservados.
            </p>
          </div>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`E-mail de confirmação enviado com sucesso para ${user.email}`);
  } catch (error) {
    console.error('Erro ao enviar e-mail de confirmação:', error);
  }
};

exports.sendNewOrderAdminNotification = async (order) => {
  try {
    const mailOptions = {
      from: `"Sistema Lumo" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🚨 ALERTA DE VENDA - ${order.totalPrice} FCFA (Pedido #${order._id.toString().slice(-6).toUpperCase()})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-top: 4px solid #16a34a; padding: 20px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #16a34a; margin-top: 0;">Nova Venda Entrou! 🎉</h1>
          <p style="color: #4b5563;">Tens uma nova encomenda a aguardar processamento.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 28px;">${order.totalPrice} FCFA</h2>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            
            <p><strong>ID do Pedido:</strong> ${order._id}</p>
            <p><strong>Quantidade de Itens:</strong> ${order.shopOrders.reduce((acc, shop) => acc + shop.items.length, 0)} produtos</p>
            <p><strong>Método:</strong> ${order.paymentMethod === 'transfer' ? 'Transferência Bancária (Confirmar Recibo)' : 'Cartão de Crédito'}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                ${generateItemsListHtml(order)}
            </table>
          </div>

          <p style="text-align: center;">
            <a href="http://localhost:3000/admin/dashboard/orders" style="background-color: #1f2937; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Gerir Encomenda no Painel
            </a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Notificação de nova venda enviada para o admin.');
  } catch (error) {
    console.error('Erro ao enviar e-mail para o admin:', error);
  }
};

