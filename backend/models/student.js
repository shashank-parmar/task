module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        profilePicture:{
            type:DataTypes.STRING,
            allowNUll:true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mobile: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING(1000),
            allowNUll:false
        }
    },{
        timestamps: false,
        tableName: 'students', 
    });

    Student.sync({force:false})

    return Student;
};
