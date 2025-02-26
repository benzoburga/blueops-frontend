import React from 'react';
import { 
    BiBookAlt, 
    BiMessage,
    BiSolidReport, 
    BiStats, 
    BiTask, 
    BiHelpCircle,
    BiGroup,
    } from 'react-icons/bi';
import '../styles/sidebar.css';
const Sidebar = () => {
    return (
        <div className="menu">
            <div className="logo">
                <BiBookAlt className="logo-icon"/>
                <h2>BlueOps</h2>
            </div>

            <div className="menu--list">
                <a href="#" className="item active">
                    <BiGroup className="icon"/>
                    Clientes
                </a>
                <a href="#" className="item">
                    <BiTask className="icon"/>
                    Archivos
                </a>
                <a href="#" className="item">
                    <BiSolidReport className="icon" />
                    Publicaciones
                </a>
                <a href="#" className="item">
                    <BiStats className="icon"/>
                    Stats
                </a>
                <a href="#" className="item">
                    <BiMessage className="icon"/>
                    Message
                </a>
                <a href="#" className="item">
                    <BiHelpCircle className="icon" />
                    Help
                </a>
            </div>
        </div>
    );
};

export default Sidebar;