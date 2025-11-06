import { createTheme, Theme } from '@mui/material/styles'

// Professional color palette - corporate design (Light Mode)
export const lightTheme = createTheme({
	palette: {
		primary: {
			main: '#2c3e50', // Dark blue-grey
			light: '#34495e',
			dark: '#1a252f',
			contrastText: '#ffffff',
		},
		secondary: {
			main: '#3498db', // Professional blue
			light: '#5dade2',
			dark: '#2471a3',
			contrastText: '#ffffff',
		},
		success: {
			main: '#27ae60', // Muted green
			light: '#2ecc71',
			dark: '#229954',
			contrastText: '#ffffff',
		},
		error: {
			main: '#e74c3c', // Muted red
			light: '#ec7063',
			dark: '#c0392b',
			contrastText: '#ffffff',
		},
		warning: {
			main: '#f39c12', // Professional amber
			light: '#f8b739',
			dark: '#e67e22',
			contrastText: '#ffffff',
		},
		info: {
			main: '#3498db',
			light: '#5dade2',
			dark: '#2980b9',
			contrastText: '#ffffff',
		},
		background: {
			default: '#f8f9fa',
			paper: '#ffffff',
		},
		text: {
			primary: '#2c3e50',
			secondary: '#7f8c8d',
			disabled: '#bdc3c7',
		},
		divider: '#ecf0f1',
	},
	typography: {
		fontFamily: [
			'Inter',
			'-apple-system',
			'BlinkMacSystemFont',
			'"Segoe UI"',
			'Roboto',
			'"Helvetica Neue"',
			'Arial',
			'sans-serif',
		].join(','),
		h1: {
			fontWeight: 700,
			fontSize: '2.5rem',
			letterSpacing: '-0.5px',
			color: '#2c3e50',
		},
		h2: {
			fontWeight: 700,
			fontSize: '2rem',
			letterSpacing: '-0.5px',
			color: '#2c3e50',
		},
		h3: {
			fontWeight: 600,
			fontSize: '1.75rem',
			letterSpacing: '-0.5px',
			color: '#2c3e50',
		},
		h4: {
			fontWeight: 600,
			fontSize: '1.5rem',
			color: '#2c3e50',
		},
		h5: {
			fontWeight: 600,
			fontSize: '1.25rem',
			color: '#2c3e50',
		},
		h6: {
			fontWeight: 600,
			fontSize: '1.125rem',
			color: '#2c3e50',
		},
		subtitle1: {
			fontSize: '1rem',
			fontWeight: 500,
			color: '#34495e',
		},
		subtitle2: {
			fontSize: '0.875rem',
			fontWeight: 500,
			color: '#7f8c8d',
		},
		body1: {
			fontSize: '1rem',
			lineHeight: 1.6,
			color: '#2c3e50',
		},
		body2: {
			fontSize: '0.875rem',
			lineHeight: 1.6,
			color: '#7f8c8d',
		},
		button: {
			textTransform: 'none',
			fontWeight: 600,
		},
		caption: {
			fontSize: '0.75rem',
			color: '#95a5a6',
		},
	},
	shape: {
		borderRadius: 6,
	},
	shadows: [
		'none',
		'0 1px 3px 0 rgba(0, 0, 0, 0.06)',
		'0 2px 4px 0 rgba(0, 0, 0, 0.08)',
		'0 4px 6px 0 rgba(0, 0, 0, 0.1)',
		'0 5px 10px 0 rgba(0, 0, 0, 0.12)',
		'0 6px 12px 0 rgba(0, 0, 0, 0.14)',
		'0 8px 16px 0 rgba(0, 0, 0, 0.16)',
		'0 10px 20px 0 rgba(0, 0, 0, 0.18)',
		'0 12px 24px 0 rgba(0, 0, 0, 0.20)',
		'0 14px 28px 0 rgba(0, 0, 0, 0.22)',
		'0 16px 32px 0 rgba(0, 0, 0, 0.24)',
		'0 18px 36px 0 rgba(0, 0, 0, 0.26)',
		'0 20px 40px 0 rgba(0, 0, 0, 0.28)',
		'0 22px 44px 0 rgba(0, 0, 0, 0.30)',
		'0 24px 48px 0 rgba(0, 0, 0, 0.32)',
		'0 26px 52px 0 rgba(0, 0, 0, 0.34)',
		'0 28px 56px 0 rgba(0, 0, 0, 0.36)',
		'0 30px 60px 0 rgba(0, 0, 0, 0.38)',
		'0 32px 64px 0 rgba(0, 0, 0, 0.40)',
		'0 34px 68px 0 rgba(0, 0, 0, 0.42)',
		'0 36px 72px 0 rgba(0, 0, 0, 0.44)',
		'0 38px 76px 0 rgba(0, 0, 0, 0.46)',
		'0 40px 80px 0 rgba(0, 0, 0, 0.48)',
		'0 42px 84px 0 rgba(0, 0, 0, 0.50)',
		'0 44px 88px 0 rgba(0, 0, 0, 0.52)',
	],
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					backgroundColor: '#f8f9fa',
					lineHeight: 1.6,
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: '#ffffff',
					color: '#2c3e50',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
					borderBottom: '1px solid #ecf0f1',
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 6,
					textTransform: 'none',
					fontWeight: 600,
					padding: '8px 16px',
					boxShadow: 'none',
					'&:hover': {
						boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
					},
				},
				contained: {
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
					'&:hover': {
						boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
					},
				},
				outlined: {
					borderWidth: '1.5px',
					'&:hover': {
						borderWidth: '1.5px',
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
					border: '1px solid #ecf0f1',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
				},
				outlined: {
					border: '1.5px solid #ecf0f1',
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						'& fieldset': {
							borderColor: '#dfe6e9',
							borderWidth: '1.5px',
						},
						'&:hover fieldset': {
							borderColor: '#b2bec3',
						},
						'&.Mui-focused fieldset': {
							borderColor: '#3498db',
							borderWidth: '2px',
						},
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 600,
					borderRadius: 6,
				},
				filled: {
					border: '1px solid',
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					borderRadius: 6,
					border: '1px solid',
				},
				standardSuccess: {
					backgroundColor: '#d5f4e6',
					borderColor: '#27ae60',
					color: '#1e7e4f',
				},
				standardError: {
					backgroundColor: '#fadbd8',
					borderColor: '#e74c3c',
					color: '#c0392b',
				},
				standardWarning: {
					backgroundColor: '#fef5e7',
					borderColor: '#f39c12',
					color: '#d68910',
				},
				standardInfo: {
					backgroundColor: '#d6eaf8',
					borderColor: '#3498db',
					color: '#2471a3',
				},
			},
		},
		MuiTableHead: {
			styleOverrides: {
				root: {
					'& .MuiTableCell-head': {
						backgroundColor: '#34495e',
						color: '#ffffff',
						fontWeight: 600,
						fontSize: '0.875rem',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						borderBottom: '2px solid #2c3e50',
					},
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: '1px solid #ecf0f1',
					padding: '12px 16px',
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					'&:nth-of-type(even)': {
						backgroundColor: '#fafbfc',
					},
					'&:hover': {
						backgroundColor: '#f1f3f5',
					},
				},
			},
		},
		MuiToggleButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					border: '1.5px solid #dfe6e9',
					'&.Mui-selected': {
						backgroundColor: '#2c3e50',
						color: '#ffffff',
						'&:hover': {
							backgroundColor: '#34495e',
						},
					},
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.9375rem',
				},
			},
		},
	},
})

// Professional dark mode theme
export const darkTheme = createTheme({
		palette: {
		mode: 'dark',
		primary: {
			main: '#A855F7', // Purple (no blue)
			light: '#C084FC',
			dark: '#9333EA',
			contrastText: '#FFFFFF',
		},
		secondary: {
			main: '#EC4899', // Pink/Magenta (no blue)
			light: '#F472B6',
			dark: '#DB2777',
			contrastText: '#FFFFFF',
		},
		success: {
			main: '#34D399', // Emerald green
			light: '#6EE7B7',
			dark: '#10B981',
			contrastText: '#0F172A',
		},
		error: {
			main: '#F87171', // Red
			light: '#FCA5A5',
			dark: '#EF4444',
			contrastText: '#FFFFFF',
		},
		warning: {
			main: '#FBBF24', // Amber
			light: '#FCD34D',
			dark: '#F59E0B',
			contrastText: '#0F172A',
		},
		info: {
			main: '#F59E0B', // Amber/Orange (no blue)
			light: '#FBBF24',
			dark: '#D97706',
			contrastText: '#FFFFFF',
		},
		background: {
			default: '#000000', // Pure black
			paper: '#0A0A0A', // Very dark grey (no blue tint)
		},
		text: {
			primary: '#FFFFFF', // Pure white for maximum contrast
			secondary: '#B0B0B0', // Light grey
			disabled: '#757575', // Medium grey
		},
		divider: '#1F1F1F', // Very dark divider (no blue)
		action: {
			hover: '#151515', // Subtle hover
			selected: '#1F1F1F', // Selected state
		},
	},
	typography: {
		fontFamily: [
			'Inter',
			'-apple-system',
			'BlinkMacSystemFont',
			'"Segoe UI"',
			'Roboto',
			'"Helvetica Neue"',
			'Arial',
			'sans-serif',
		].join(','),
		h1: {
			fontWeight: 700,
			fontSize: '2.5rem',
			letterSpacing: '-0.5px',
			color: '#F1F5F9',
		},
		h2: {
			fontWeight: 700,
			fontSize: '2rem',
			letterSpacing: '-0.5px',
			color: '#F1F5F9',
		},
		h3: {
			fontWeight: 600,
			fontSize: '1.75rem',
			letterSpacing: '-0.5px',
			color: '#F1F5F9',
		},
		h4: {
			fontWeight: 600,
			fontSize: '1.5rem',
			color: '#F1F5F9',
		},
		h5: {
			fontWeight: 600,
			fontSize: '1.25rem',
			color: '#F1F5F9',
		},
		h6: {
			fontWeight: 600,
			fontSize: '1.125rem',
			color: '#F1F5F9',
		},
		subtitle1: {
			fontSize: '1rem',
			fontWeight: 500,
			color: '#CBD5E1',
		},
		subtitle2: {
			fontSize: '0.875rem',
			fontWeight: 500,
			color: '#94A3B8',
		},
		body1: {
			fontSize: '1rem',
			lineHeight: 1.6,
			color: '#F1F5F9',
		},
		body2: {
			fontSize: '0.875rem',
			lineHeight: 1.6,
			color: '#CBD5E1',
		},
		button: {
			textTransform: 'none',
			fontWeight: 600,
		},
		caption: {
			fontSize: '0.75rem',
			color: '#94A3B8',
		},
	},
	shape: {
		borderRadius: 6,
	},
	shadows: [
		'none',
		'0 1px 3px 0 rgba(0, 0, 0, 0.3)',
		'0 2px 4px 0 rgba(0, 0, 0, 0.35)',
		'0 4px 6px 0 rgba(0, 0, 0, 0.4)',
		'0 5px 10px 0 rgba(0, 0, 0, 0.45)',
		'0 6px 12px 0 rgba(0, 0, 0, 0.5)',
		'0 8px 16px 0 rgba(0, 0, 0, 0.55)',
		'0 10px 20px 0 rgba(0, 0, 0, 0.6)',
		'0 12px 24px 0 rgba(0, 0, 0, 0.65)',
		'0 14px 28px 0 rgba(0, 0, 0, 0.7)',
		'0 16px 32px 0 rgba(0, 0, 0, 0.75)',
		'0 18px 36px 0 rgba(0, 0, 0, 0.8)',
		'0 20px 40px 0 rgba(0, 0, 0, 0.85)',
		'0 22px 44px 0 rgba(0, 0, 0, 0.9)',
		'0 24px 48px 0 rgba(0, 0, 0, 0.95)',
		'0 26px 52px 0 rgba(0, 0, 0, 1)',
		'0 28px 56px 0 rgba(0, 0, 0, 1)',
		'0 30px 60px 0 rgba(0, 0, 0, 1)',
		'0 32px 64px 0 rgba(0, 0, 0, 1)',
		'0 34px 68px 0 rgba(0, 0, 0, 1)',
		'0 36px 72px 0 rgba(0, 0, 0, 1)',
		'0 38px 76px 0 rgba(0, 0, 0, 1)',
		'0 40px 80px 0 rgba(0, 0, 0, 1)',
		'0 42px 84px 0 rgba(0, 0, 0, 1)',
		'0 44px 88px 0 rgba(0, 0, 0, 1)',
	],
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					backgroundColor: '#000000',
					lineHeight: 1.6,
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: '#0A0A0A',
					color: '#FFFFFF',
					boxShadow: 'none',
					borderBottom: '1px solid #1F1F1F',
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 6,
					textTransform: 'none',
					fontWeight: 600,
					padding: '8px 16px',
					boxShadow: 'none',
					'&:hover': {
						boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.35)',
					},
				},
				contained: {
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
					'&:hover': {
						boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.35)',
					},
				},
				outlined: {
					borderWidth: '1.5px',
					'&:hover': {
						borderWidth: '1.5px',
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					boxShadow: 'none',
					border: '1px solid #1F1F1F',
					backgroundColor: '#0F0F0F',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					boxShadow: 'none',
					backgroundColor: '#0F0F0F',
				},
				outlined: {
					border: '1.5px solid #1F1F1F',
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						backgroundColor: '#0F0F0F',
						'& fieldset': {
							borderColor: '#1F1F1F',
							borderWidth: '1.5px',
						},
						'&:hover fieldset': {
							borderColor: '#2F2F2F',
						},
						'&.Mui-focused fieldset': {
							borderColor: '#A855F7',
							borderWidth: '2px',
						},
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 600,
					borderRadius: 6,
				},
				filled: {
					border: '1px solid',
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					borderRadius: 6,
					border: '1px solid',
				},
				standardSuccess: {
					backgroundColor: '#064E3B',
					borderColor: '#34D399',
					color: '#6EE7B7',
				},
				standardError: {
					backgroundColor: '#7F1D1D',
					borderColor: '#F87171',
					color: '#FCA5A5',
				},
				standardWarning: {
					backgroundColor: '#78350F',
					borderColor: '#FBBF24',
					color: '#FCD34D',
				},
				standardInfo: {
					backgroundColor: '#78350F',
					borderColor: '#FBBF24',
					color: '#FCD34D',
				},
			},
		},
		MuiTableHead: {
			styleOverrides: {
				root: {
					'& .MuiTableCell-head': {
						backgroundColor: '#0F0F0F',
						color: '#FFFFFF',
						fontWeight: 600,
						fontSize: '0.875rem',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						borderBottom: '2px solid #1F1F1F',
					},
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: '1px solid #1F1F1F',
					padding: '12px 16px',
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					'&:nth-of-type(even)': {
						backgroundColor: '#0A0A0A',
					},
					'&:hover': {
						backgroundColor: '#151515',
					},
				},
			},
		},
		MuiToggleButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					border: '1.5px solid #475569',
					color: '#CBD5E1',
					'&.Mui-selected': {
						backgroundColor: '#60A5FA',
						color: '#0F172A',
						'&:hover': {
							backgroundColor: '#93C5FD',
						},
					},
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.9375rem',
				},
			},
		},
	},
})

// Export for backward compatibility
export const professionalTheme = lightTheme

