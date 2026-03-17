// Inside your ClientsPage.jsx -> renderDetailPanel logic:

<List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
  {clientVehicles.map((car, idx) => (
    <ListItem key={car.id} divider={idx < clientVehicles.length - 1}>
      <ListItemText 
        primary={
          <Link
            component="button"
            variant="body2"
            sx={{ fontWeight: 'bold', textAlign: 'left' }}
            onClick={() => onNavigateCar(car.license_plate?.split('\r')[0])} // Triggers jump to Cars
          >
            {car.make} {car.model}
          </Link>
        } 
        secondary={`Plate: ${car.license_plate?.split('\r')[0]} | Color: ${car.color}`} 
      />
    </ListItem>
  ))}
</List>