
import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader, Search, RefreshCw, Trash2 } from 'lucide-react'
import { uploadImage, autoLinkImageByFilename } from '../../lib/admin'
import './Images.css'

export default function Images() {
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState([]) // Array of { name, status, product, error }
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)

    const handleFiles = async (files) => {
        setUploading(true)
        const newResults = []

        for (const file of Array.from(files)) {
            const result = { name: file.name, status: 'uploading' }
            setResults(prev => [result, ...prev])

            try {
                // 1. Upload to storage
                const url = await uploadImage(file)

                // 2. Try to auto-link
                const linkResult = await autoLinkImageByFilename(url, file.name)

                if (linkResult && linkResult.linked) {
                    result.status = 'success'
                    result.product = linkResult.product
                } else if (linkResult && linkResult.reason === 'already_exists') {
                    result.status = 'warning'
                    result.message = 'Ya estaba vinculada'
                    result.product = linkResult.product
                } else {
                    result.status = 'error'
                    result.error = 'No se encontró producto con ese código'
                }
            } catch (err) {
                result.status = 'error'
                result.error = err.message
            }

            setResults(prev => {
                const updated = [...prev]
                const idx = updated.findIndex(r => r.name === file.name && r.status === 'uploading')
                if (idx !== -1) updated[idx] = result
                return updated
            })
        }
        setUploading(false)
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const onFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files)
        }
    }

    return (
        <div className="images-bulk">
            <div className="images-bulk__header">
                <div>
                    <h1>Vinculación Inteligente de Fotos</h1>
                    <p>Sube las fotos y el sistema las unirá a los productos según el nombre del archivo.</p>
                </div>
            </div>

            <div className="images-bulk__grid">
                {/* Upload Area */}
                <div className="images-bulk__upload-card">
                    <div
                        className={`upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current.click()}
                    >
                        {uploading ? (
                            <div className="upload-zone__content">
                                <Loader size={48} className="animate-spin" />
                                <h3>Subiendo Archivos...</h3>
                                <p>Por favor no cierres esta ventana.</p>
                            </div>
                        ) : (
                            <div className="upload-zone__content">
                                <div className="upload-icon-pulse">
                                    <Upload size={48} />
                                </div>
                                <h3>Arrastra tus fotos aquí</h3>
                                <p>O haz clic para seleccionar archivos desde tu PC</p>
                                <span className="upload-tip">El nombre debe contener el código (ej: P12301.jpg)</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            hidden
                        />
                    </div>
                </div>

                {/* Results Section */}
                <div className="images-bulk__results">
                    <div className="results-header">
                        <h3>Actividad Reciente</h3>
                        <button className="btn-clean" onClick={() => setResults([])}>Limpiar Lista</button>
                    </div>

                    <div className="results-list">
                        {results.length === 0 ? (
                            <div className="results-empty">
                                <ImageIcon size={48} />
                                <p>Aquí aparecerán los resultados de tus cargas.</p>
                            </div>
                        ) : (
                            results.map((res, i) => (
                                <div key={i} className={`result-item ${res.status}`}>
                                    <div className="result-item__icon">
                                        {res.status === 'uploading' && <Loader size={20} className="animate-spin" />}
                                        {res.status === 'success' && <CheckCircle size={20} />}
                                        {res.status === 'warning' && <AlertCircle size={20} />}
                                        {res.status === 'error' && <AlertCircle size={20} />}
                                    </div>
                                    <div className="result-item__info">
                                        <span className="filename">{res.name}</span>
                                        {res.product && (
                                            <span className="product-match">
                                                Producto: <strong>{res.product.name}</strong>
                                            </span>
                                        )}
                                        {res.error && <span className="error-msg">{res.error}</span>}
                                        {res.message && <span className="warning-msg">{res.message}</span>}
                                    </div>
                                    <div className="result-item__badge">
                                        {res.status.toUpperCase()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
