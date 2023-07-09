import React, { useEffect } from 'react';

function Notifications() {
  useEffect(() => {
    fetch(`http://vps-222d59be.vps.ovh.net:5000/api/challenges/list_to_accept`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.parse(localStorage.getItem('user')).id_users),
    })
      .then((response) => response.json())
      .then((dataBack) => {
        // const dataBackArray = Object.entries(dataBack);
        // setChallengesList(dataBack);
        // setChallengesList(dataBack)
      })
      .catch((error) => {
        console.error(error);
        //   toast.current.show({severity:'error', summary: 'Error', detail:'Bad credentials', life: 3000});
      });
  }, []);
  return (
    <div>
      <p>Bienvenue sur la Notifications page</p>
    </div>
  );
}
export default Notifications;
