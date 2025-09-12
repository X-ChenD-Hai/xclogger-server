
import { Grid, TextField, Typography } from '@mui/material';
type state<T> = [T, (val: T) => void];

export interface ProjectsPanelProps {
    project_location: state<string>;
};

const ProjectsPanel = (pros: ProjectsPanelProps) => {

    return (
        <Grid container sx={{ mt: 1, width: '100%', height: '100%' }}>
            <Grid size={1.5}>
                <Typography align='right' sx={{ mt: 1, mr: 2 }} variant='body1'>项目路径:</Typography>
            </Grid>
            <Grid size={8}>
                <TextField size='small'
                    sx={{ width: '100%' }}
                    label="项目路径"
                    value={pros.project_location[0]}
                    onChange={(e) => pros.project_location[1](e.target.value)} />
            </Grid>
        </Grid>
    )
}

export default ProjectsPanel;