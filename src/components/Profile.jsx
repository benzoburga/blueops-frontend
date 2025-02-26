import React from 'react';
import ProfileHeader from './ProfileHeader';
import '../styles/profile.css';
import userImage from '../assets/image.png';
import {BiBook} from 'react-icons/bi';

const courses= [
    {
        title: 'Celular',
        duratiion: '+51 924 772 092',
        icon: <BiBook/>,
    },
    {
        title: 'Correo Electrónico',
        duratiion: 'mquinones@blueops.pe',
        icon: <BiBook/>,
    },
    {
        title: 'Linkedin',
        duratiion: 'https://www.linkedin.com/in/mquinon/',
        icon: <BiBook/>,
    },
];

const Profile = () => {
    return (
    <div className="profile">
        <ProfileHeader/>

        <div className="user--profile">
            <div className="user--detail">
                <img src={userImage} alt="" />
                <h3 className="username">Marcelo Quiñones</h3>
                <span className="profession">Gerente General</span>
            </div>

            <div className="user-courses">
             {courses.map((coures) => (
              <div className="course">
               <div className="course-detail">
                <div className="course-cover">{coures.icon}</div>
                    <div className="course-name">
                      <h5 className="title">{coures.title}</h5>
                      <span className="duration">{coures.duratiion}</span>
                    </div>               
                </div>
                <div className="action">:</div>
              </div>
            ))}           
            </div>
        </div>
    </div>
    );
};

export default Profile;