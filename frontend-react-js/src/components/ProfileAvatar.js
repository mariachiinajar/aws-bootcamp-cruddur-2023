import './ProfileAvatar.css';

export default function ProfileAvatar(props) {
    const pop_activities_form = (event) => {
        event.preventDefault();
        props.setPopped(true);
        return false;
    }

    const backgroundImage = `url("https://assets.goodstuff.cloud/${props.user}.jpg")`
    const styles = {
        backgroundImage: backgroundImage,
        backgroundSize: 'cover',
        BackgroundPosition: 'center',
    }

    return (
        <div 
            className='profile-avatar'
            style={styles}
        ></div>
    )
}