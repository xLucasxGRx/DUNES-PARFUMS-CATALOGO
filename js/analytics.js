/**
 * Dunes Parfums - Central Analytics Layer (js/analytics.js - FASE M30)
 * Capa central defensiva y ligera para el seguimiento del embudo comercial de GA4 + Microsoft Clarity.
 * Garantiza cero PII (datos personales), alta resistencia a fallos y compatibilidad con Node.js / Browser.
 */

(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        root.Analytics = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    const FORBIDDEN_PII_KEYS = new Set([
        'nombre', 'nombre_cliente', 'direccion', 'telefono', 'referencia',
        'mensaje', 'mensaje_whatsapp', 'texto_whatsapp', 'correo', 'email',
        'user_id', 'user_property', 'input_text', 'code_text', 'coupon_code'
    ]);

    /**
     * Limpia un objeto eliminando propiedades vacías o clasificadas como PII
     */
    function sanitizePayload(payload) {
        if (!payload || typeof payload !== 'object') return {};
        const clean = {};
        for (const [key, val] of Object.entries(payload)) {
            if (FORBIDDEN_PII_KEYS.has(key.toLowerCase())) {
                continue;
            }
            if (val !== undefined && val !== null && !Number.isNaN(val)) {
                clean[key] = val;
            }
        }
        return clean;
    }

    /**
     * Formatea un producto según el estándar e-commerce de GA4 despersonalizado
     */
    function formatItem(product, quantity = 1, presentacionTexto = null, tamanoMl = null, precioEspecifico = null) {
        if (!product) return null;

        const idStr = String(product.id || product.idProducto || '');
        const nombre = product.nombre || product.item_name || 'Perfume';
        const marca = product.marca || product.item_brand || 'Dunes Parfums';
        const categoria = product.categoria || product.tipo || product.item_category || 'general';

        let precioReal = product.precio || product.price || 0;

        // Regla M30: si es oferta válida, usar precio_oferta
        const esDecant = String(categoria).toLowerCase().includes('decant') || String(product.formato || '').toLowerCase().includes('decant') || tamanoMl !== null;
        if (!esDecant && product.oferta === true && (typeof product.precio_oferta === 'number' || typeof product.precioOferta === 'number')) {
            precioReal = product.precio_oferta ?? product.precioOferta;
        }

        if (precioEspecifico !== null && typeof precioEspecifico === 'number' && !Number.isNaN(precioEspecifico)) {
            precioReal = precioEspecifico;
        }

        const variant = presentacionTexto || product.presentacion || product.item_variant || (tamanoMl ? `Decant ${tamanoMl} ml` : 'Sellado');

        const itemObj = {
            item_id: idStr,
            item_name: nombre,
            item_brand: marca,
            item_category: categoria,
            item_variant: variant,
            price: Number(precioReal.toFixed(2)),
            quantity: Number(quantity) || 1
        };

        return sanitizePayload(itemObj);
    }

    /**
     * Emite evento genérico a gtag si está disponible
     */
    function track(eventName, params = {}) {
        try {
            const cleanParams = sanitizePayload(params);
            if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                window.gtag('event', eventName, cleanParams);
            }
        } catch (err) {
            // Defensivo: no interrumpir la tienda por errores de medición
        }
    }

    /**
     * Emite evento e-commerce estandarizado a GA4
     */
    function trackEcommerce(eventName, data = {}) {
        try {
            const payload = {
                currency: 'PEN',
                value: typeof data.value === 'number' ? Number(data.value.toFixed(2)) : 0,
                ...data
            };
            if (Array.isArray(data.items)) {
                payload.items = data.items.map(i => sanitizePayload(i));
            }
            track(eventName, payload);
        } catch (err) {
            // Defensivo
        }
    }

    /**
     * Emite evento personalizado a Microsoft Clarity si está disponible
     */
    function trackClarity(eventName) {
        try {
            if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
                window.clarity('event', eventName);
            }
        } catch (err) {
            // Defensivo
        }
    }

    // --- MÉTODOS ESPECÍFICOS DEL EMBUDO COMERCIAL ---

    function trackAddToCart(product, precioUnitario, cantidad, presentacionTexto) {
        const item = formatItem(product, cantidad, presentacionTexto, null, precioUnitario);
        if (!item) return;

        const totalValue = Number(((precioUnitario || item.price) * (cantidad || 1)).toFixed(2));
        trackEcommerce('add_to_cart', {
            value: totalValue,
            items: [item]
        });
        trackClarity('add_to_cart');
    }

    function trackRemoveFromCart(itemRaw) {
        const item = formatItem(itemRaw, itemRaw.cantidad || 1, itemRaw.presentacion, itemRaw.tamanoMl, itemRaw.precioUnitario);
        if (!item) return;

        const totalValue = Number(((itemRaw.precioUnitario || item.price) * (itemRaw.cantidad || 1)).toFixed(2));
        trackEcommerce('remove_from_cart', {
            value: totalValue,
            items: [item]
        });
    }

    function trackViewCart(itemsRaw = [], subtotal = 0) {
        const items = (itemsRaw || []).map(i => formatItem(i, i.cantidad, i.presentacion, i.tamanoMl, i.precioUnitario)).filter(Boolean);
        trackEcommerce('view_cart', {
            value: Number(Number(subtotal).toFixed(2)),
            items: items
        });
    }

    function trackBeginCheckout(itemsRaw = [], subtotal = 0) {
        const items = (itemsRaw || []).map(i => formatItem(i, i.cantidad, i.presentacion, i.tamanoMl, i.precioUnitario)).filter(Boolean);
        trackEcommerce('begin_checkout', {
            value: Number(Number(subtotal).toFixed(2)),
            items: items
        });
        trackClarity('begin_checkout');
    }

    function trackShippingInfo(shippingTier, itemsRaw = [], subtotal = 0) {
        const normTier = String(shippingTier || '').toLowerCase().replace('-', '_');
        const items = (itemsRaw || []).map(i => formatItem(i, i.cantidad, i.presentacion, i.tamanoMl, i.precioUnitario)).filter(Boolean);

        trackEcommerce('add_shipping_info', {
            value: Number(Number(subtotal).toFixed(2)),
            shipping_tier: normTier,
            items: items
        });
        trackClarity('shipping_selected');
    }

    function trackCouponApplied(discountType, discountValue) {
        track('coupon_applied', {
            discount_type: discountType || 'fixed',
            discount_value: typeof discountValue === 'number' ? Number(discountValue.toFixed(2)) : 0
        });
    }

    function trackCatalogSearch(resultsCount = 0) {
        track('catalog_search', {
            search_used: true,
            results_count: Number(resultsCount) || 0
        });
    }

    function trackLead(pedidoInfo = {}) {
        const total = typeof pedidoInfo.totalFinal === 'number' ? pedidoInfo.totalFinal : Number(pedidoInfo.totalFinal) || 0;
        const normType = String(pedidoInfo.tipoEntrega || 'delivery_local').toLowerCase().replace('-', '_');

        const items = (pedidoInfo.items || pedidoInfo.productos || []).map(i => formatItem(i, i.cantidad, i.presentacion, i.tamanoMl, i.precioUnitario || i.precio)).filter(Boolean);

        trackEcommerce('generate_lead', {
            value: Number(total.toFixed(2)),
            delivery_type: normType,
            items: items
        });
        trackClarity('whatsapp_lead');
    }

    function trackItem(eventName, product, extraParams = {}) {
        const item = formatItem(product, 1);
        if (!item) return;
        trackEcommerce(eventName, {
            value: item.price,
            items: [item],
            ...extraParams
        });
    }

    return {
        sanitizePayload,
        formatItem,
        track,
        trackEcommerce,
        trackItem,
        trackClarity,
        trackAddToCart,
        trackRemoveFromCart,
        trackViewCart,
        trackBeginCheckout,
        trackShippingInfo,
        trackCouponApplied,
        trackCatalogSearch,
        trackLead
    };
}));
