import logo from '../assets/Logo.png';

function Header(){
    const headerStyle = {
        backgroundColor: 'var(--color-navbar)',
        height: '65px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const logoStyle = {
        width: '150px'
    };
    return(
        <header style={headerStyle}>
            <img src={logo} alt='logo'style={logoStyle}/>
        </header>
    );
}

export default Header;