import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';


import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

//  Standard string concatenation 
pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@" + pdfjs.version + "/build/pdf.worker.min.mjs";

const EbookViewer = () => {
    const { txId } = useParams();
    const navigate = useNavigate();
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);

    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    const fileConfig = {
        url: "http://localhost:5000/api/vault/" + txId,
        httpHeaders: { Authorization: "Bearer " + token }
    };

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: '15px 30px', backgroundColor: '#000', borderBottom: '2px solid #4A90E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
                <h2 style={{ margin: 0, color: '#4A90E2', textTransform: 'uppercase' }}>Secure E-Book Viewer</h2>
                <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
                    GO BACK
                </button>
            </div>

            {/* The Vault Area (Disables Right-Click) */}
            <div 
                style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', position: 'relative', userSelect: 'none' }}
                onContextMenu={(e) => e.preventDefault()} 
            >
                {/*  Anti-Screenshot Watermark Overlay */}
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10, display: 'flex', flexWrap: 'wrap', opacity: 0.05, fontSize: '24px', color: 'red', transform: 'rotate(-30deg)', overflow: 'hidden' }}>
                    {/*  Standard string concatenation */}
                    {Array(200).fill("BORROWED BY: " + (user.email || 'USER') + " ").map((t, i) => <span key={i} style={{ padding: '20px', whiteSpace: 'nowrap' }}>{t}</span>)}
                </div>

                {error ? (
                    <div style={{ color: '#f44336', textAlign: 'center', marginTop: '50px', backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '8px', border: '2px solid #f44336' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{error}</h2>
                        <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Your borrow time may have expired, or you do not have permission to view this file.</p>
                        <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 30px', backgroundColor: '#f44336', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>RETURN TO PROFILE</button>
                    </div>
                ) : (
                    <div style={{ backgroundColor: '#fff', padding: '20px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', minWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Document
                            file={fileConfig}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            onLoadError={(err) => {
                                console.error("PDF Load Error:", err);
                                setError("Access Denied to Vault.");
                            }}
                            loading={<h2 style={{ color: '#000', textAlign: 'center', padding: '50px' }}>Decrypting Secure File...</h2>}
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                /*  Standard string concatenation for keys */
                                <div key={"page_" + (index + 1)} style={{ marginBottom: '20px', border: '1px solid #ccc', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={800} 
                                        renderTextLayer={false} /*  Prevents Text Selection */
                                        renderAnnotationLayer={false} /*  Prevents Link Extraction */
                                    />
                                </div>
                            ))}
                        </Document>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EbookViewer;
