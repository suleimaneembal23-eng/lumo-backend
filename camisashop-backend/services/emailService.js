const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const STORE_URL = process.env.STORE_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const getAbsoluteUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/60';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Function to get site name from settings
const getSiteName = async () => {
    try {
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne();
        return settings?.siteName || "Lumo";
    } catch (error) {
        console.error('Error fetching site name:', error);
        return "Lumo";
    }
};

// 🎨 Template "Clean & Minimalist" (Estilo Stripe/Apple)
const getPremiumTemplate = (title, bodyContent, actionText = null, actionUrl = null, siteName = "Lumo") => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f6f9fc; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333333;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f6f9fc;
            padding-bottom: 40px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        
        .header { 
            padding: 30px 40px; 
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 700; 
            color: #1a1a1a;
            letter-spacing: -0.5px;
        }
        
        .content { 
            padding: 40px; 
            font-size: 16px; 
            line-height: 1.6; 
            color: #4a5568;
        }
        
        h2 {
            color: #1a1a1a;
            font-size: 22px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
        }
        
        /* Modern Data Table */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            background-color: #f8fafc;
            border-radius: 8px;
            overflow: hidden;
        }
        .data-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        .data-table tr:last-child td {
            border-bottom: none;
        }
        .data-label { color: #718096; font-weight: 500; }
        .data-value { color: #2d3748; font-weight: 600; text-align: right; }
        
        .order-item {
            padding: 15px 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        .order-item:last-child { border-bottom: none; }
        
        .total-row {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #edf2f7;
            text-align: right;
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
        }
        
        .btn-container { text-align: center; margin-top: 35px; }
        .btn { 
            display: inline-block; 
            background-color: #3b82f6; /* Beautiful standard blue */
            color: #ffffff !important; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 15px;
            transition: background-color 0.2s;
        }
        .btn:hover { background-color: #2563eb; }
        
        .footer { 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #a0aec0; 
            background-color: #f6f9fc;
        }
        .footer a { color: #718096; text-decoration: none; font-weight: 500; margin: 0 5px; }
        
        /* Mobile */
        @media only screen and (max-width: 600px) {
            .content { padding: 25px; }
            .header { padding: 25px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div style="height: 40px;"></div>
        <div class="container">
            <div class="header">
                <h1>${siteName}</h1>
            </div>
            <div class="content">
                ${bodyContent}
                
                ${actionText && actionUrl ? `
                <div class="btn-container">
                    <a href="${actionUrl}" class="btn">${actionText}</a>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${siteName}. Todos os direitos reservados.</p>
            <p>
                <a href="${STORE_URL}">Loja</a> • 
                <a href="${STORE_URL}/help">Suporte</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
};

exports.sendOrderConfirmation = async (toEmail, order) => {
    try {
        const siteName = await getSiteName();
        const itemsList = order.items.map(item => {
            const customizationText = item.customization?.name
                ? `<div style="font-size: 12px; color: #718096; margin-top: 4px;">✨ ${item.customization.name} ${item.customization.number || ''} ${item.customization.hasBadge ? '+ Badge' : ''}</div>`
                : '';

            const itemName = item.name || (item.productId && item.productId.name) || 'Produto Indisponível';
            const itemImageRaw = item.image || (item.productId && item.productId.image);
            const itemImage = getAbsoluteUrl(itemImageRaw);

            // Link para o produto (usando productId)
            const productIdStr = item.productId && item.productId._id ? item.productId._id : item.productId;
            const productUrl = `${STORE_URL}/product/${productIdStr}`;

            return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
                <tr>
                    <td width="72" valign="top" style="padding: 12px 0 12px 12px;">
                        <img src="${itemImage}" alt="${itemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; display: block;">
                    </td>
                    <td valign="top" style="padding: 12px;">
                        <a href="${productUrl}" style="font-weight: 600; color: #3b82f6; text-decoration: none; font-size: 15px; display: block;">${itemName}</a>
                        <div style="font-size: 13px; color: #718096; margin-top: 4px;">Tamanho: ${item.size} • Qtd: ${item.quantity}</div>
                        ${customizationText}
                    </td>
                    <td width="100" valign="middle" align="right" style="padding: 12px 12px 12px 0; font-weight: 600; color: #4a5568; font-size: 15px;">
                        ${Math.round(item.price * item.quantity).toLocaleString('de-DE')} FCFA
                    </td>
                </tr>
            </table>`;
        }).join('');

        // Busca os dados reais do user caso não estejam populados
        let clientName = 'Cliente';
        let clientEmail = 'Sem email';
        try {
            const userDoc = await User.findById(order.userId);
            if (userDoc) {
                clientName = userDoc.name || (userDoc.email ? userDoc.email.split('@')[0] : 'Cliente');
                clientEmail = userDoc.email || 'Sem email';
            }
        } catch(e) {}

        const body = `
            <h2>Pedido Confirmado! 🎉</h2>
            <p>Olá ${clientName},</p>
            <p>Recebemos o seu pedido <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong>. Obrigado por comprar connosco!</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <div style="font-size: 11px; text-transform: uppercase; color: #a0aec0; letter-spacing: 1px; font-weight: 700; margin-bottom: 10px;">Resumo do Pedido</div>
                ${itemsList}
                <div class="total-row">Total: ${Math.round(order.totalPrice).toLocaleString('de-DE')} FCFA</div>
            </div>

            <p style="margin-bottom: 30px;">Enviaremos outro email assim que o pagamento for confirmado ou o pedido for enviado.</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center;">
                 <p style="font-size: 14px; color: #718096;">Precisa de ajuda ou mudou de ideia?</p>
                 <a href="${STORE_URL}/faq" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;">Ler Perguntas Frequentes</a>
            </div>
        `;

        await transporter.sendMail({
            from: `"${siteName}" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Confirmação de Pedido #${order._id.toString().slice(-6).toUpperCase()}`,
            html: getPremiumTemplate("", body, "Ver Meu Pedido", `${STORE_URL}/client/dashboard/orders`, siteName) // Title is inside body for better control
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de confirmação:", error);
    }
};

exports.sendNewOrderAlert = async (order) => {
    try {
        const siteName = await getSiteName();
        const adminEmail = process.env.EMAIL_USER;

        // CORREÇÃO: Fetch the actual user document to ensure we have name/email
        let clientName = "Cliente Convidado";
        let clientEmail = "Sem email";
        try {
            const userDoc = await User.findById(order.userId);
            if (userDoc) {
                clientName = userDoc.name || (userDoc.email ? userDoc.email.split('@')[0] : "Cliente Convidado");
                clientEmail = userDoc.email || "Sem email";
            }
        } catch(e) {}

        // 🖼️ Product list with images
        const productsList = order.items.map(item => {
            const customizationText = item.customization?.name
                ? `<div style="font-size: 11px; color: #718096; margin-top: 4px;">✨ ${item.customization.name} ${item.customization.number || ''} ${item.customization.hasBadge ? '+ Badge' : ''}</div>`
                : '';

            const itemName = item.name || (item.productId && item.productId.name) || 'Produto Indisponível';
            const itemImageRaw = item.image || (item.productId && item.productId.image);
            const itemImage = getAbsoluteUrl(itemImageRaw);

            return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
                <tr>
                    <td width="72" valign="top" style="padding: 12px 0 12px 12px;">
                        <img src="${itemImage}" alt="${itemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; display: block;">
                    </td>
                    <td valign="top" style="padding: 12px;">
                        <div style="font-weight: 600; color: #1a202c; font-size: 15px; display: block; margin-bottom: 4px;">${itemName}</div>
                        <div style="font-size: 13px; color: #718096;">Tamanho: ${item.size} • Qtd: ${item.quantity}</div>
                        ${customizationText}
                    </td>
                    <td width="100" valign="middle" align="right" style="padding: 12px 12px 12px 0; font-weight: 700; color: #10b981; font-size: 15px;">
                        ${Math.round(item.price * item.quantity).toLocaleString('de-DE')} FCFA
                    </td>
                </tr>
            </table>`;
        }).join('');

        const body = `
            <h2>💰 Nova Venda Recebida!</h2>
            <p>Você acabou de receber um novo pedido na loja.</p>
            
            <table class="data-table">
                <tr>
                    <td class="data-label">Cliente</td>
                    <td class="data-value">${clientName}<br><span style="font-size: 12px; font-weight: 400; color: #718096;">${clientEmail}</span></td>
                </tr>
                <tr>
                    <td class="data-label">Pedido #</td>
                    <td class="data-value">${order._id.toString().slice(-6).toUpperCase()}</td>
                </tr>
                <tr>
                    <td class="data-label">Método de Pagamento</td>
                    <td class="data-value">${order.paymentMethod || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="data-label">Status</td>
                    <td class="data-value"><span style="background: ${order.status === 'paid' ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${order.status.toUpperCase()}</span></td>
                </tr>
            </table>

            <div style="margin: 20px 0;">
                <div style="font-size: 11px; text-transform: uppercase; color: #a0aec0; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px;">PRODUTOS</div>
                ${productsList}
            </div>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: right;">
                <div style="font-size: 13px; color: #718096; margin-bottom: 4px;">Subtotal: ${Math.round(order.itemsPrice || 0).toLocaleString('de-DE')} FCFA</div>
                <div style="font-size: 13px; color: #718096; margin-bottom: 8px;">Envio: ${Math.round(order.shippingPrice || 0).toLocaleString('de-DE')} FCFA</div>
                <div style="font-size: 20px; font-weight: 700; color: #10b981;">TOTAL: ${Math.round(order.totalPrice).toLocaleString('de-DE')} FCFA</div>
            </div>

            <p style="font-size: 14px; text-align: center; color: #718096; margin-top: 20px;">Acesse o painel administrativo para processar este pedido.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName} System" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `[Venda] ${Math.round(order.totalPrice).toLocaleString('de-DE')} FCFA - ${clientName}`,
            html: getPremiumTemplate("", body, "Gerenciar Pedido", `${STORE_URL}/admin/orders`, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar alerta de admin:", error);
    }
};

exports.sendVendorOrderAlert = async (order, vendorUser) => {
    try {
        const siteName = await getSiteName();
        const OrderModel = require('../models/Order');
        const populatedOrder = await OrderModel.findById(order._id).populate('items.productId');

        // Filtrar apenas os itens deste vendor
        const vendorItems = populatedOrder.items.filter(item => 
           item.productId && item.productId.vendor && item.productId.vendor.toString() === vendorUser._id.toString()
        );

        if (vendorItems.length === 0) return;

        const vendorTotal = vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const productsList = vendorItems.map(item => {
            const itemName = item.name || (item.productId && item.productId.name) || 'Produto Indisponível';
            const itemImageRaw = item.image || (item.productId && item.productId.image);
            const itemImage = getAbsoluteUrl(itemImageRaw);

            return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
                <tr>
                    <td width="72" valign="top" style="padding: 12px 0 12px 12px;">
                        <img src="${itemImage}" alt="${itemName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; display: block;">
                    </td>
                    <td valign="top" style="padding: 12px;">
                        <div style="font-weight: 600; color: #1a202c; font-size: 15px; display: block; margin-bottom: 4px;">${itemName}</div>
                        <div style="font-size: 13px; color: #718096;">Tamanho: ${item.size} • Qtd: ${item.quantity}</div>
                    </td>
                </tr>
            </table>`;
        }).join('');

        const body = `
            <h2>Nova Venda na sua Loja! 🎉</h2>
            <p>Boas notícias, <strong>${vendorUser.vendorInfo?.storeName || vendorUser.name}</strong>!</p>
            <p>Acaba de realizar uma nova venda através da ${siteName}. Aceda ao seu painel de vendas para aceitar e processar o envio desta encomenda.</p>
            
            <div style="margin: 20px 0;">
                <div style="font-size: 11px; text-transform: uppercase; color: #a0aec0; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px;">ARTIGOS COMPRADOS</div>
                ${productsList}
            </div>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: right;">
                <div style="font-size: 18px; font-weight: 700; color: #10b981;">LÍQUIDO (Estimado): ${Math.round(vendorTotal).toLocaleString('de-DE')} FCFA</div>
            </div>
            
            <p style="font-size: 14px; text-align: center; color: #718096; margin-top: 20px;">Por favor, proceda à faturação e embalamento nos próximos 2 dias úteis.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName} Parceiros" <${process.env.EMAIL_USER}>`,
            to: vendorUser.email,
            subject: `[Venda Realizada] Nova Encomenda #${order._id.toString().slice(-6).toUpperCase()}`,
            html: getPremiumTemplate("", body, "Processar Encomenda", `${STORE_URL}/vendor/dashboard/orders`, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar alerta para Vendedor:", error);
    }
};

exports.sendOrderStatusUpdate = async (toEmail, order, newStatus) => {
    try {
        const siteName = await getSiteName();
        const statusMap = {
            'confirmed': { title: 'Pagamento Confirmado', color: '#10b981', text: 'Recebemos o seu pagamento. Seu pedido está sendo preparado!' },
            'paid': { title: 'Pagamento Confirmado', color: '#10b981', text: 'Recebemos o seu pagamento. Seu pedido está sendo preparado!' },
            'processing': { title: 'Em Processamento', color: '#3b82f6', text: 'Estamos separando e embalando seus itens com todo cuidado.' },
            'shipped': { title: 'Pedido Enviado', color: '#8b5cf6', text: 'Boas notícias! Seu pedido já está com a transportadora.' },
            'delivered': { title: 'Pedido Entregue', color: '#10b981', text: 'Seu pedido foi entregue! Esperamos que goste.' },
            'cancelled': { title: 'Pedido Cancelado', color: '#ef4444', text: 'Este pedido foi cancelado e o reembolso (se aplicável) será processado.' }
        };

        const currentStatus = statusMap[newStatus] || { title: 'Status Atualizado', color: '#64748b', text: 'O status do seu pedido foi atualizado.' };

        const body = `
            <h2>${currentStatus.title}</h2>
            <p>${currentStatus.text}</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid ${currentStatus.color}; padding: 20px; border-radius: 4px; margin: 25px 0;">
                <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Pedido</div>
                <div style="font-size: 18px; font-weight: 600; color: #1e293b;">#${order._id.toString().slice(-6).toUpperCase()}</div>
                <div style="font-size: 14px; color: ${currentStatus.color}; font-weight: 600; margin-top: 5px;">${currentStatus.title}</div>
            </div>

            <p style="font-size: 14px;">Se tiver alguma dúvida, basta responder a este email.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName}" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `${currentStatus.title}: Pedido #${order._id.toString().slice(-6).toUpperCase()}`,
            html: getPremiumTemplate("", body, "Ver Detalhes", `${STORE_URL}/client/dashboard/orders`, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de status:", error);
    }
};

exports.sendMarketingEmail = async (toEmail, subject, content, actionLink = STORE_URL, actionText = "Aproveitar Oferta") => {
    try {
        const siteName = await getSiteName();
        await transporter.sendMail({
            from: `"${siteName} Ofertas" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: getPremiumTemplate("", `<h2>${subject}</h2>` + content, actionText, actionLink, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de marketing:", error);
    }
};

exports.sendPasswordResetEmail = async (toEmail, resetUrl) => {
    try {
        const siteName = await getSiteName();
        const body = `
            <h2>Recuperação de Senha</h2>
            <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por 1 hora.</p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 20px;">Se você não solicitou isso, pode ignorar este email com segurança.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName} Segurança" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Redefinir sua senha",
            html: getPremiumTemplate("", body, "Redefinir Senha", resetUrl, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de reset:", error);
    }
};

exports.sendAbandonedCartEmail = async (toEmail, cartItems, checkoutUrl) => {
    try {
        const siteName = await getSiteName();
        const itemsPreview = cartItems.slice(0, 3).map(item => `
            <div style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                <span style="font-weight: 600; color: #2d3748;">${item.name}</span>
                <br>
                <span style="font-size: 13px; color: #718096;">Tamanho: ${item.selectedSize}</span>
            </div>
        `).join('');

        const moreItems = cartItems.length > 3 ? `<p style="font-size: 12px; color: #718096; margin-top: 5px;">e mais ${cartItems.length - 3} itens...</p>` : '';

        const body = `
            <h2>Psst, esqueceu-se de algo? 👀</h2>
            <p>Notámos que deixou alguns itens excelentes no seu carrinho. Eles estão reservados para si, mas não por muito tempo!</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                ${itemsPreview}
                ${moreItems}
            </div>

            <p style="text-align: center;">Clique abaixo para finalizar a sua compra agora e garantir esses itens.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName} - O carrinho chama por si!" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Volte e termine o seu pedido! 🛒",
            html: getPremiumTemplate("", body, "Finalizar Compra", checkoutUrl, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de carrinho abandonado:", error);
    }
};

/**
 * 📧⚠️ Alerta de Stock Baixo para Vendor
 */
exports.sendLowStockAlert = async (product, vendor) => {
    try {
        if (!vendor || !vendor.email) {
            console.warn('❌ Vendor sem email, não é possível enviar alerta de stock');
            return false;
        }

        const siteName = await getSiteName();

        const body = `
            <h2 style="color: #f59e0b;">⚠️ Alerta de Stock Baixo</h2>
            <p>O produto <strong>${product.name}</strong> está com stock baixo e precisa ser reposto!</p>
            
            <table class="data-table">
                <tr>
                    <td class="data-label">📦 Stock Atual</td>
                    <td class="data-value" style="color: #dc2626; font-weight: 700;">${product.stockQuantity} unidades</td>
                </tr>
                <tr>
                    <td class="data-label">⚠️ Limite Definido</td>
                    <td class="data-value">${product.lowStockThreshold} unidades</td>
                </tr>
                <tr>
                    <td class="data-label">💰 Preço</td>
                    <td class="data-value">${Math.round(product.price).toLocaleString('de-DE')} FCFA</td>
                </tr>
                <tr>
                    <td class="data-label">📈 Vendas Totais</td>
                    <td class="data-value">${product.salesCount || 0} unidades</td>
                </tr>
            </table>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                    💡 <strong>Ação Necessária:</strong> Reponha o stock o quanto antes para evitar perder vendas!
                </p>
            </div>
            
            <p style="text-align: center; font-size: 14px; color: #64748b;">
                Este é um alerta automático do sistema ${siteName}
            </p>
        `;

        await transporter.sendMail({
            from: `"${siteName} Alerts" <${process.env.EMAIL_USER}>`,
            to: vendor.email,
            subject: `⚠️ ALERTA: Stock Baixo - ${product.name}`,
            html: getPremiumTemplate("", body, "Gerenciar Produtos", `${STORE_URL}/vendor/dashboard/products`, siteName)
        });

        console.log('✅ Email de alerta de stock baixo enviado para:', vendor.email);
        return true;

    } catch (error) {
        console.error('❌ Erro ao enviar email de alerta de stock:', error);
        return false;
    }
};

/**
 * 📧👮‍♂️ Email de Observação/Alerta Admin
 */
exports.sendAdminObservationEmail = async (toEmail, productName, observationText) => {
    try {
        const siteName = await getSiteName();
        const STORE_URL = process.env.STORE_URL || "http://localhost:3000";

        const body = `
            <h2 style="color: #ef4444;">⚠️ Aviso Administrativo</h2>
            <p>A equipa gestora deixou uma observação urgente sobre o seu produto <strong>${productName}</strong>.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 25px 0;">
                <p style="color: #991b1b; font-style: italic; margin: 0; font-size: 15px;">"${observationText}"</p>
            </div>

            <p style="font-size: 14px; color: #4b5563;">Recomendamos que aceda imediatamente à sua aba "Meus Produtos" na Dashboard e reveja/corriga o que foi solicitado para manter a conformidade da loja.</p>
        `;

        await transporter.sendMail({
            from: `"${siteName} Defesas" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `⚠️ Ação Necessária: Observação no produto ${productName}`,
            html: getPremiumTemplate("", body, "Aceder aos Produtos", `${STORE_URL}/vendor/dashboard/products`, siteName)
        });
    } catch (error) {
        console.error("❌ Erro ao enviar email de observação do admin:", error);
    }
};
