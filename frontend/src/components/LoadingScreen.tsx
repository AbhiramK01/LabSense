import { Box, CircularProgress, Typography, Backdrop } from '@mui/material'

interface LoadingScreenProps {
	open: boolean
	message?: string
}

export default function LoadingScreen({ open, message = "Processing..." }: LoadingScreenProps) {
	return (
		<Backdrop
			sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
			open={open}
		>
			<Box sx={{ textAlign: 'center' }}>
				<CircularProgress color="inherit" size={60} />
				<Typography variant="h6" sx={{ mt: 2 }}>
					{message}
				</Typography>
			</Box>
		</Backdrop>
	)
}
