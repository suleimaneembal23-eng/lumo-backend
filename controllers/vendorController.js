const User = require('../models/User');

// PUT /api/vendors/profile — Atualizar perfil e configurações da loja
exports.updateVendorProfile = async (req, res) => {
    try {
        const { vendorInfo, phone } = req.body;
        const userId = req.user.id;

        // Usar $set com paths granulares para não sobrescrever subscription nem slug
        const updateFields = {};

        if (vendorInfo) {
            if (vendorInfo.storeName     !== undefined) updateFields['vendorInfo.storeName']     = vendorInfo.storeName;
            if (vendorInfo.description   !== undefined) updateFields['vendorInfo.description']   = vendorInfo.description;
            if (vendorInfo.logo          !== undefined) updateFields['vendorInfo.logo']          = vendorInfo.logo;
            if (vendorInfo.banner        !== undefined) updateFields['vendorInfo.banner']        = vendorInfo.banner;
            if (vendorInfo.allowsDelivery !== undefined) updateFields['vendorInfo.allowsDelivery'] = vendorInfo.allowsDelivery;
            if (vendorInfo.allowsPickup   !== undefined) updateFields['vendorInfo.allowsPickup']   = vendorInfo.allowsPickup;

            // Shipping settings
            if (vendorInfo.shippingSettings) {
                const s = vendorInfo.shippingSettings;
                if (s.flatRate              !== undefined) updateFields['vendorInfo.shippingSettings.flatRate']              = s.flatRate;
                if (s.freeShippingThreshold !== undefined) updateFields['vendorInfo.shippingSettings.freeShippingThreshold'] = s.freeShippingThreshold;
                if (s.deliveryTime          !== undefined) updateFields['vendorInfo.shippingSettings.deliveryTime']          = s.deliveryTime;
                if (s.returnPolicy          !== undefined) updateFields['vendorInfo.shippingSettings.returnPolicy']          = s.returnPolicy;
            }

            // Pickup address
            if (vendorInfo.pickupAddress) {
                const p = vendorInfo.pickupAddress;
                if (p.line1      !== undefined) updateFields['vendorInfo.pickupAddress.line1']      = p.line1;
                if (p.city       !== undefined) updateFields['vendorInfo.pickupAddress.city']       = p.city;
                if (p.postalCode !== undefined) updateFields['vendorInfo.pickupAddress.postalCode'] = p.postalCode;
                if (p.country    !== undefined) updateFields['vendorInfo.pickupAddress.country']    = p.country;
            }
        }

        if (phone !== undefined) updateFields['phone'] = phone;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: false }
        ).select('-password');

        if (!updatedUser || updatedUser.role !== 'vendor') {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        res.json({
            name:       updatedUser.name,
            email:      updatedUser.email,
            phone:      updatedUser.phone,
            role:       updatedUser.role,
            vendorInfo: updatedUser.vendorInfo,
        });

    } catch (err) {
        console.error('Erro ao atualizar perfil do vendor:', err);
        res.status(500).json({ message: 'Erro ao salvar configurações.', error: err.message });
    }
};

// GET /api/vendors/profile — Obter perfil atual do vendor logado
exports.getVendorProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao obter perfil.', error: err.message });
    }
};
