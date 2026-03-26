import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('estudio-cart')
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('estudio-cart', JSON.stringify(cartItems))
    }, [cartItems])

    const addToCart = (product) => {
        setCartItems(prevItems => {
            // Buscar si ya existe el producto con mismo id, talle y color
            const existingIndex = prevItems.findIndex(
                item => item.id === product.id &&
                    item.size === product.size &&
                    item.color === product.color
            )

            if (existingIndex > -1) {
                // Actualizar cantidad si ya existe
                const updated = [...prevItems]
                updated[existingIndex].quantity += product.quantity || 1
                return updated
            }

            // Agregar nuevo item
            return [...prevItems, { ...product, quantity: product.quantity || 1 }]
        })
    }

    const removeFromCart = (productId, size) => {
        setCartItems(prevItems =>
            prevItems.filter(item => !(item.id === productId && item.size === size))
        )
    }

    const updateQuantity = (productId, size, newQuantity) => {
        if (newQuantity < 1) return

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === productId && item.size === size
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        )
    }

    const clearCart = () => {
        setCartItems([])
    }

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    }

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0)
    }

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
