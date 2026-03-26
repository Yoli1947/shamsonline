import { useState, useEffect } from 'react'
import { getProducts, getBrands, getCategories, getSiteSettings } from '../lib/api'

/**
 * Hook para obtener productos con filtros
 */
export function useProducts(options = {}) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true)
                setError(null)
                const { products: data } = await getProducts(options)
                setProducts(data)
            } catch (err) {
                setError(err.message)
                console.error('Error fetching products:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [JSON.stringify(options)])

    return { products, loading, error, refetch: () => { } }
}

/**
 * Hook para obtener marcas
 */
export function useBrands() {
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchBrands() {
            try {
                setLoading(true)
                const data = await getBrands()
                setBrands(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchBrands()
    }, [])

    return { brands, loading, error }
}

/**
 * Hook para obtener categorías
 */
export function useCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchCategories() {
            try {
                setLoading(true)
                const data = await getCategories()
                setCategories(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return { categories, loading, error }
}

/**
 * Hook para obtener configuración del sitio
 */
export function useSiteSettings() {
    const [settings, setSettings] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSettings() {
            try {
                const data = await getSiteSettings()
                setSettings(data)
            } catch (err) {
                console.error('Error fetching site settings:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    return { settings, loading }
}
